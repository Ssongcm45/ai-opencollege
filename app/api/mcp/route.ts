import { NextRequest, NextResponse } from "next/server";
import { requireAgent, type AgentIdentity } from "@/lib/agent-auth";
import { AgentError, originAllowed, readLimitedText } from "@/lib/agent-http";
import {
  createBlogDraft,
  getBlogDraft,
  listBlogCategories,
  listBlogDrafts,
  parseDraftId,
  updateBlogDraft,
  uploadBlogImage,
} from "@/lib/agent-blog";
import { canonicalHint } from "@/lib/blog-seo";

/* ────────────────────────────────────────────────
   원격 MCP 서버 (Streamable HTTP, 상태 없음) — 외부 AI 에이전트가 블로그 초안을 등록한다.
   의존성 없이 JSON-RPC 2.0 을 직접 처리하고 항상 application/json 으로 답한다.
   요청마다 Authorization: Bearer <에이전트 키> 를 확인한다. 발행은 관리자 화면에서만 한다.
   /api/admin 밖에 있어 관리자 세션 쿠키가 아니라 키로만 인증한다 (middleware.ts 대상 아님).
──────────────────────────────────────────────── */

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "opencollege-blog-drafts", version: "1.0.0" };
const INSTRUCTIONS =
  "AI OpenCollege 블로그 초안 등록 서버입니다. 이 서버로는 블로그 글을 초안(비공개) 상태로만 등록·수정할 수 있고, " +
  "발행(공개)은 관리자가 미리보기로 검토한 뒤 관리자 화면에서 직접 합니다. 글을 쓰기 전에 list_blog_categories 로 " +
  "카테고리 목록을 확인하고 그중 하나를 쓰세요 (목록에 없는 값은 거부됩니다). 본문은 마크다운이 기본이며 contentFormat 을 \"html\" 로 주면 HTML 로 받습니다. " +
  "이미지(썸네일·OG·본문)는 https 주소나 data:image/...;base64 URI 로 보내면 서버가 자체 저장소로 옮겨 WebP 로 저장합니다 " +
  "(이미지당 5MB, 본문 이미지 최대 20개). 에이전트가 만든 초안만 조회·수정할 수 있고, 발행된 글이나 관리자가 쓴 글은 건드릴 수 없습니다.";

/* ── 도구 정의 ── */

const imageDesc = "https:// 이미지 주소 또는 data:image/(png|jpeg|webp|gif);base64,... — 서버가 자체 저장소로 옮겨 저장 (5MB 이하)";
const idSchema = { type: "string", format: "uuid", description: "초안 id (등록 결과의 id)" };

const seoSchema = {
  type: "object",
  description: "검색엔진·공유용 설정. 비우면 제목·부제·썸네일을 그대로 쓴다.",
  properties: {
    title: { type: "string", maxLength: 200, description: "검색 결과 제목 (없으면 글 제목)" },
    description: { type: "string", maxLength: 500, description: "검색 결과 설명 (없으면 부제)" },
    keywords: {
      description: "키워드 — 쉼표로 구분한 문자열 또는 문자열 배열",
      anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    },
    ogImage: { type: "string", description: `공유 미리보기 이미지 (없으면 썸네일). ${imageDesc}` },
    canonicalUrl: { type: "string", description: `대표 주소 — ${canonicalHint()} 만 허용` },
    noindex: { type: "boolean", description: "true 면 검색엔진 색인 제외" },
  },
  additionalProperties: false,
};

const draftProps = {
  title: { type: "string", maxLength: 180, description: "글 제목" },
  subtitle: { type: "string", maxLength: 300, description: "제목 아래에 보이는 한 줄 요약 (없으면 본문 앞부분으로 만든다)" },
  content: {
    type: "string",
    maxLength: 100000,
    description: `본문. 기본은 마크다운이며 이미지는 ![설명](주소) 로 넣는다 — ${imageDesc}. # 제목은 h2 로 표시된다.`,
  },
  contentFormat: { type: "string", enum: ["markdown", "html"], description: "content 형식 (기본 markdown). html 이면 허용 태그만 남기고 정리한다" },
  category: { type: "string", maxLength: 60, description: "카테고리 — list_blog_categories 의 값 중 하나 (필수)" },
  slug: { type: "string", maxLength: 120, description: "URL 슬러그 (영문 소문자·숫자·하이픈). 없으면 제목의 영문으로 만들거나 post-YYYYMMDD-xxxx, 겹치면 -2, -3 을 붙인다" },
  thumbnail: { type: "string", description: `썸네일 이미지. ${imageDesc}` },
  seo: seoSchema,
};

const TOOLS = [
  {
    name: "list_blog_categories",
    title: "블로그 카테고리 목록",
    description: "관리자가 정한 블로그 카테고리 목록을 돌려준다. 초안의 category 는 이 중 하나여야 한다.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "create_blog_draft",
    title: "블로그 초안 등록",
    description: "블로그 글을 초안(비공개) 상태로 등록한다. 공개되지 않으며, 관리자가 미리보기로 검토한 뒤 발행한다. 결과에 미리보기·편집 주소가 담긴다.",
    inputSchema: {
      type: "object",
      properties: draftProps,
      required: ["title", "content", "category"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  {
    name: "update_blog_draft",
    title: "블로그 초안 수정",
    description: "에이전트가 만든 초안을 부분 수정한다. 보낸 필드만 바뀐다 (null 을 보내면 선택 필드를 비운다). 발행된 글은 수정할 수 없다.",
    inputSchema: {
      type: "object",
      properties: { id: idSchema, ...draftProps },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "get_blog_draft",
    title: "블로그 초안 조회",
    description: "에이전트가 만든 초안 하나의 전체 내용(본문·SEO 포함)을 돌려준다.",
    inputSchema: {
      type: "object",
      properties: { id: idSchema },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "list_blog_drafts",
    title: "블로그 초안 목록",
    description: "에이전트가 등록했고 아직 발행되지 않은 초안 목록 (최근 100개).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "upload_blog_image",
    title: "블로그 이미지 업로드",
    description: "이미지 하나를 먼저 자체 저장소에 올리고 주소와 마크다운 조각을 돌려준다. 본문에 넣기 전에 올리고 싶을 때 쓴다.",
    inputSchema: {
      type: "object",
      properties: {
        image: { type: "string", description: imageDesc },
        alt: { type: "string", maxLength: 200, description: "대체 텍스트" },
      },
      required: ["image"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
];

const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));

function args(params: Record<string, unknown>) {
  const value = params.arguments ?? {};
  if (typeof value !== "object" || Array.isArray(value) || value === null) {
    throw new AgentError(400, "arguments 는 JSON 객체여야 합니다.");
  }
  return value as Record<string, unknown>;
}

async function runTool(agent: AgentIdentity, name: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  switch (name) {
    case "list_blog_categories":
      return listBlogCategories();
    case "create_blog_draft":
      return createBlogDraft(agent, input);
    case "update_blog_draft": {
      const { id, ...rest } = input;
      return updateBlogDraft(agent, parseDraftId(id), rest);
    }
    case "get_blog_draft":
      return getBlogDraft(agent, parseDraftId(input.id));
    case "list_blog_drafts":
      return listBlogDrafts(agent);
    case "upload_blog_image":
      return uploadBlogImage(agent, input);
    default:
      throw new AgentError(404, `알 수 없는 도구: ${name}`);
  }
}

/* ── JSON-RPC ── */

type RpcId = string | number | null;

function rpcError(id: RpcId, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function rpcResult(id: RpcId, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

async function handleMessage(agent: AgentIdentity, msg: unknown): Promise<object | null> {
  if (!msg || typeof msg !== "object" || Array.isArray(msg)) return rpcError(null, -32600, "Invalid Request");
  const m = msg as Record<string, unknown>;
  const hasId = "id" in m;
  const id = (typeof m.id === "string" || typeof m.id === "number") ? m.id : null;

  // 클라이언트가 보낸 응답(result/error)은 받기만 한다
  if (m.method === undefined && ("result" in m || "error" in m)) return null;
  if (m.jsonrpc !== "2.0" || typeof m.method !== "string") return hasId ? rpcError(id, -32600, "Invalid Request") : null;
  // 알림(id 없음)은 답하지 않는다
  if (!hasId) return null;
  if (m.params !== undefined && (typeof m.params !== "object" || m.params === null || Array.isArray(m.params))) {
    return rpcError(id, -32602, "params 는 객체여야 합니다.");
  }
  const params = (m.params ?? {}) as Record<string, unknown>;

  switch (m.method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return rpcResult(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const name = params.name;
      if (typeof name !== "string" || !TOOL_NAMES.has(name)) {
        return rpcError(id, -32602, `알 수 없는 도구입니다: ${String(name)}`);
      }
      let input: Record<string, unknown>;
      try {
        input = args(params);
      } catch (err) {
        return rpcError(id, -32602, (err as Error).message);
      }
      try {
        const result = await runTool(agent, name, input);
        return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
      } catch (err) {
        if (!(err instanceof AgentError)) console.error("[api/mcp] 도구 실행 실패:", err instanceof Error ? err.name : "unknown");
        const message = err instanceof AgentError ? err.message : "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
        return rpcResult(id, { content: [{ type: "text", text: message }], isError: true });
      }
    }
    default:
      return rpcError(id, -32601, `지원하지 않는 메서드입니다: ${m.method}`);
  }
}

function httpError(status: number, code: number, message: string, headers: Record<string, string> = {}) {
  return NextResponse.json(rpcError(null, code, message), { status, headers });
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return httpError(403, -32000, "허용되지 않은 Origin 입니다.");

  let agent: AgentIdentity;
  try {
    const gate = await requireAgent(req);
    if ("failure" in gate) return httpError(gate.failure.status, -32001, gate.failure.error, gate.failure.headers);
    agent = gate.agent;
  } catch (err) {
    console.error("[api/mcp] 인증 실패:", err instanceof Error ? err.name : "unknown");
    return httpError(500, -32603, "서버 오류가 발생했습니다.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(await readLimitedText(req));
  } catch (err) {
    if (err instanceof AgentError) return httpError(err.status, -32600, err.message);
    return httpError(400, -32700, "Parse error: JSON 을 읽을 수 없습니다.");
  }

  try {
    // 배치는 받지 않는다 (MCP 2025-06-18 에서 빠졌고, 요청 한 번에 여러 호출을 묶어 횟수 제한을 피할 수 있다)
    if (Array.isArray(payload)) return httpError(400, -32600, "Invalid Request: JSON-RPC 배치는 지원하지 않습니다. 메시지를 하나씩 보내 주세요.");
    const res = await handleMessage(agent, payload);
    return res ? NextResponse.json(res) : new Response(null, { status: 202 });
  } catch (err) {
    console.error("[api/mcp] 처리 실패:", err instanceof Error ? err.name : "unknown");
    return httpError(500, -32603, "Internal error");
  }
}

// 상태 없는 서버라 SSE 스트림(GET)과 세션 종료(DELETE)는 지원하지 않는다
function methodNotAllowed() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
