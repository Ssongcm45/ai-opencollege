import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";

/* 에이전트 REST·MCP 엔드포인트 공통 — 오류 형식, 요청 본문 크기 제한, Origin 검사 */

export const MAX_AGENT_BODY_BYTES = 8 * 1024 * 1024;

export class AgentError extends Error {
  constructor(public status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 503, message: string) {
    super(message);
    this.name = "AgentError";
  }
}

export function agentErrorResponse(status: number, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers });
}

export function handleAgentError(error: unknown) {
  if (error instanceof AgentError) return agentErrorResponse(error.status, error.message);
  // 요청 본문·키가 섞이지 않도록 오류 이름만 남긴다
  console.error("[agent] 처리 실패:", error instanceof Error ? error.name : "unknown");
  return agentErrorResponse(500, "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
}

/** 본문을 크기 제한(8MB)을 지키며 읽는다. content-length 를 먼저 보고, 읽는 도중에도 확인한다 */
export async function readLimitedText(req: Request, maxBytes = MAX_AGENT_BODY_BYTES): Promise<string> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new AgentError(413, "요청 본문은 8MB 이하여야 합니다.");
  if (!req.body) return "";

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new AgentError(413, "요청 본문은 8MB 이하여야 합니다.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readLimitedJson(req: Request): Promise<unknown> {
  const text = await readLimitedText(req);
  try {
    return JSON.parse(text);
  } catch {
    throw new AgentError(400, "JSON 본문을 읽을 수 없습니다.");
  }
}

// 대표 도메인과 www 주소만 허용한다 (next.config.ts 가 www 를 대표 도메인으로 모은다)
const ALLOWED_ORIGINS = (() => {
  const origin = new URL(siteUrl).origin;
  const set = new Set([origin]);
  const url = new URL(siteUrl);
  if (!url.hostname.startsWith("www.") && url.hostname.includes(".")) set.add(`${url.protocol}//www.${url.host}`);
  return set;
})();

/** Origin 헤더가 있으면 우리 사이트만 허용한다 (DNS 재바인딩·브라우저 교차 요청 방지). 서버 간 호출은 보통 Origin 이 없다 */
export function originAllowed(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || ALLOWED_ORIGINS.has(origin);
}
