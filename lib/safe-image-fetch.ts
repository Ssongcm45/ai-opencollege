import https from "node:https";
import dns from "node:dns";
import { lookup as dnsLookup } from "node:dns/promises";
import net from "node:net";
import type { IncomingMessage } from "node:http";

/* ────────────────────────────────────────────────
   외부 이미지 URL 을 서버에서 안전하게 받아 온다 (SSRF 방지).
   - https 만, URL 안 계정정보 금지, 443 포트만
   - DNS 결과가 사설·루프백·링크로컬·CGNAT·메타데이터 대역이면 거부
     (미리 검사 + 실제 연결 시 lookup 에서 다시 검사해 DNS 재바인딩도 막는다)
   - 리다이렉트는 직접 따라가며 최대 3번, 매번 다시 검사
   - 전체 10초 제한, 크기 제한을 넘으면 받는 도중 끊는다
──────────────────────────────────────────────── */

export class ImageFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageFetchError";
  }
}

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

const blocked = new net.BlockList();
for (const [addr, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(addr, prefix, "ipv4");
for (const [addr, prefix] of [
  ["::", 128], ["::1", 128], ["::", 96], ["64:ff9b::", 96], ["64:ff9b:1::", 48],
  ["100::", 64], ["2001::", 32], ["2001:db8::", 32], ["2002::", 16],
  ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) blocked.addSubnet(addr, prefix, "ipv6");

/** ::ffff:a.b.c.d / ::ffff:7f00:1 형태의 IPv4 매핑 주소면 IPv4 로 풀어 준다 */
function unmapIpv4(address: string): string | null {
  const lower = address.toLowerCase();
  const dotted = lower.match(/^(?:0{0,4}:){0,5}:?ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];
  const hex = lower.match(/^(?:0{0,4}:){0,5}:?ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return null;
}

export function isBlockedAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return blocked.check(address, "ipv4");
  if (family === 6) {
    const mapped = unmapIpv4(address);
    if (mapped) return blocked.check(mapped, "ipv4");
    return blocked.check(address, "ipv6");
  }
  return true;
}

/** URL 형식 검사 후 호스트 이름을 돌려준다 (IPv6 는 대괄호 제거) */
function checkUrl(url: URL) {
  if (url.protocol !== "https:") throw new ImageFetchError("https:// 주소만 허용됩니다.");
  if (url.username || url.password) throw new ImageFetchError("주소에 계정 정보를 넣을 수 없습니다.");
  if (url.port && url.port !== "443") throw new ImageFetchError("443 이외의 포트는 허용되지 않습니다.");
  return url.hostname.replace(/^\[|\]$/g, "");
}

async function assertPublicHost(hostname: string) {
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) throw new ImageFetchError("내부·사설 네트워크 주소는 허용되지 않습니다.");
    return;
  }
  let addresses: { address: string }[];
  try {
    addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ImageFetchError(`호스트를 찾을 수 없습니다: ${hostname}`);
  }
  if (!addresses.length || addresses.some((a) => isBlockedAddress(a.address))) {
    throw new ImageFetchError("내부·사설 네트워크 주소로 연결되는 호스트는 허용되지 않습니다.");
  }
}

// 실제 소켓 연결 직전 lookup — 검사와 연결 사이에 DNS 가 바뀌어도 막힌다
const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { all: true, verbatim: true, family: options.family }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (!list.length || list.some((a) => isBlockedAddress(a.address))) {
      return callback(new ImageFetchError("내부·사설 네트워크 주소로 연결되는 호스트는 허용되지 않습니다."), "", 0);
    }
    if ((options as dns.LookupOptions).all) {
      (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
    } else {
      callback(null, list[0].address, list[0].family);
    }
  });
};

function requestOnce(url: URL, signal: AbortSignal): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "GET",
      lookup: safeLookup,
      signal,
      headers: { "User-Agent": "OpenCollege-Blog-Image-Fetcher/1.0", Accept: "image/*" },
    }, resolve);
    req.on("error", reject);
    req.end();
  });
}

/** 외부 이미지를 받아 바이트와 Content-Type 을 돌려준다 */
export async function fetchRemoteImage(source: string, maxBytes: number): Promise<{ buffer: Buffer; contentType: string }> {
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    throw new ImageFetchError("올바른 URL 이 아닙니다.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let hop = 0; ; hop++) {
      await assertPublicHost(checkUrl(url));
      let res: IncomingMessage;
      try {
        res = await requestOnce(url, controller.signal);
      } catch (err) {
        if (err instanceof ImageFetchError) throw err;
        if (controller.signal.aborted) throw new ImageFetchError("이미지를 받는 데 10초를 넘었습니다.");
        throw new ImageFetchError(`연결에 실패했습니다 (${(err as Error).message}).`);
      }

      const status = res.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        res.resume();
        const location = res.headers.location;
        if (!location) throw new ImageFetchError(`리다이렉트(${status})에 이동할 주소가 없습니다.`);
        if (hop >= MAX_REDIRECTS) throw new ImageFetchError("리다이렉트가 너무 많습니다 (최대 3번).");
        url = new URL(location, url);
        continue;
      }
      if (status !== 200) {
        res.resume();
        throw new ImageFetchError(`이미지 서버가 ${status} 응답을 보냈습니다.`);
      }

      const contentType = String(res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
      if (!contentType.startsWith("image/")) {
        res.resume();
        throw new ImageFetchError(`이미지가 아닌 응답입니다 (Content-Type: ${contentType || "없음"}).`);
      }
      const declared = Number(res.headers["content-length"] ?? 0);
      if (declared > maxBytes) {
        res.destroy();
        throw new ImageFetchError("이미지 크기는 5MB 이하여야 합니다.");
      }

      const chunks: Buffer[] = [];
      let size = 0;
      try {
        for await (const chunk of res) {
          size += (chunk as Buffer).length;
          if (size > maxBytes) {
            res.destroy();
            throw new ImageFetchError("이미지 크기는 5MB 이하여야 합니다.");
          }
          chunks.push(chunk as Buffer);
        }
      } catch (err) {
        if (err instanceof ImageFetchError) throw err;
        if (controller.signal.aborted) throw new ImageFetchError("이미지를 받는 데 10초를 넘었습니다.");
        throw new ImageFetchError("이미지를 받는 중 연결이 끊어졌습니다.");
      }
      return { buffer: Buffer.concat(chunks), contentType };
    }
  } finally {
    clearTimeout(timer);
  }
}
