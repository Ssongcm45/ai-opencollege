import { put } from "@vercel/blob";
import sharp from "sharp";

/* ────────────────────────────────────────────────
   검사를 마친 이미지를 우리 저장소(Vercel Blob)에 올린다.
   관리자 업로드(/api/admin/upload)와 같은 방식으로 1600px 이하 WebP 로 다시 인코딩해 저장한다.
   Vercel Blob 은 BLOB_READ_WRITE_TOKEN 환경변수가 있어야 동작한다 (Vercel 에서 Blob 스토어를 연결하면 자동 설정).
──────────────────────────────────────────────── */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// 압축 폭탄 방지 — 디코딩할 최대 픽셀 수 (약 7000x7000)
const MAX_INPUT_PIXELS = 50_000_000;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export class ImageStoreUnavailableError extends Error {
  constructor() {
    super("이미지 저장소(Vercel Blob)가 설정되지 않았습니다.");
    this.name = "ImageStoreUnavailableError";
  }
}

export class ImageDecodeError extends Error {
  constructor() {
    super("이미지를 읽을 수 없습니다 (손상됐거나 너무 큰 이미지입니다).");
    this.name = "ImageDecodeError";
  }
}

export function hasImageSignature(bytes: Uint8Array, type: AllowedImageType) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/gif") return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

/** 파일 앞부분 시그니처로 실제 이미지 형식을 알아낸다 (모르면 null) */
export function detectImageType(bytes: Uint8Array): AllowedImageType | null {
  return ALLOWED_IMAGE_TYPES.find((type) => hasImageSignature(bytes, type)) ?? null;
}

export function imageStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// 토큰 형식(vercel_blob_rw_<storeId>_<secret>)에서 우리 스토어의 공개 주소를 만든다. 토큰 값 자체는 노출하지 않는다.
function ownBlobOrigin(): string | null {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
  return storeId && /^[A-Za-z0-9]+$/.test(storeId) ? `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com` : null;
}

/** 이미 우리 Blob 스토어에 있는 이미지 주소인지 */
export function isOwnStorageUrl(value: string) {
  const origin = ownBlobOrigin();
  if (!origin) return false;
  try {
    const url = new URL(value);
    return url.origin === origin && !url.username && !url.password && url.pathname.length > 1;
  } catch {
    return false;
  }
}

/** 시그니처 검사를 마친 이미지를 WebP 로 바꿔 저장하고 공개 URL 을 돌려준다. prefix 는 Blob 경로 앞부분 (예: blog) */
export async function storeImage(buffer: Buffer, type: AllowedImageType, prefix: string): Promise<string> {
  if (!imageStoreConfigured()) throw new ImageStoreUnavailableError();

  let output: Buffer;
  try {
    output = await sharp(buffer, { animated: type === "image/gif", limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ImageDecodeError();
  }

  const blob = await put(`${prefix}/${crypto.randomUUID()}.webp`, output, {
    access: "public",
    contentType: "image/webp"
  });
  return blob.url;
}
