import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { isAdminSessionValid } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminSessionValid())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "4MB 이하 이미지만 업로드할 수 있습니다." }, { status: 400 });
  }

  try {
    const output = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const blob = await put(`thumbnails/${crypto.randomUUID()}.webp`, output, {
      access: "public",
      contentType: "image/webp"
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[upload] 이미지 처리 실패:", error);
    return NextResponse.json({ error: "이미지 처리에 실패했습니다." }, { status: 500 });
  }
}
