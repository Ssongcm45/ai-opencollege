import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/lib/db";
import { agentKeys } from "@/lib/db/schema";

/* ────────────────────────────────────────────────
   외부 AI 에이전트 API 키 인증.
   키 형식: oc_agent_ + 32바이트 base64url(43자). DB 에는 SHA-256 해시만 저장한다.
   요청마다 Authorization: Bearer <키> 를 확인한다. 키 원문은 어디에도 기록하지 않는다.
──────────────────────────────────────────────── */

export const AGENT_KEY_PREFIX = "oc_agent_";
export const BLOG_DRAFT_SCOPE = "blog:draft";
const KEY_PATTERN = /^oc_agent_[A-Za-z0-9_-]{43}$/;

export type AgentIdentity = { id: string; name: string; scopes: string[] };

export function hashAgentKey(key: string) {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

/** 새 키 발급 — 원문 key 는 이때 한 번만 관리자에게 보여 준다 */
export function generateAgentKey() {
  const key = `${AGENT_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { key, prefix: key.slice(0, 16), hash: hashAgentKey(key) };
}

function bearerToken(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(\S+)\s*$/i);
  return match?.[1] ?? null;
}

export async function authenticateAgent(req: Request): Promise<AgentIdentity | null> {
  const key = bearerToken(req);
  if (!key || !KEY_PATTERN.test(key) || !hasDatabase) return null;

  const hash = hashAgentKey(key);
  const db = getDb();
  const [row] = await db.select().from(agentKeys).where(eq(agentKeys.keyHash, hash)).limit(1);
  if (!row || row.revokedAt) return null;
  const a = Buffer.from(row.keyHash, "utf8");
  const b = Buffer.from(hash, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // 마지막 사용 시각 — 1분에 한 번만 기록하고, 실패해도 요청은 막지 않는다
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
    try {
      await db.update(agentKeys).set({ lastUsedAt: new Date() }).where(eq(agentKeys.id, row.id));
    } catch {
      console.error("[agent-auth] last_used_at 갱신 실패");
    }
  }

  return {
    id: row.id,
    name: row.name,
    scopes: row.scopes.split(/[\s,]+/).filter(Boolean)
  };
}

export function hasScope(agent: AgentIdentity, scope: string) {
  return agent.scopes.includes(scope);
}

/* 키별 요청 제한 — 1분에 30회. 서버 인스턴스마다 따로 센다(메모리). */
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;
const MAX_CLIENTS = 1024;

type Bucket = { startedAt: number; count: number };

export function createAgentLimiter(now: () => number = Date.now) {
  const buckets = new Map<string, Bucket>();
  function prune(time: number) {
    for (const [key, bucket] of buckets) {
      if (time - bucket.startedAt >= WINDOW_MS) buckets.delete(key);
    }
  }
  return {
    /** 허용이면 0, 제한이면 다시 시도까지 남은 초 */
    consume(agentId: string): number {
      const time = now();
      let bucket = buckets.get(agentId);
      if (bucket && time - bucket.startedAt >= WINDOW_MS) {
        buckets.delete(agentId);
        bucket = undefined;
      }
      if (!bucket) {
        if (buckets.size >= MAX_CLIENTS) prune(time);
        if (buckets.size >= MAX_CLIENTS) return Math.ceil(WINDOW_MS / 1000);
        buckets.set(agentId, { startedAt: time, count: 1 });
        return 0;
      }
      if (bucket.count >= MAX_REQUESTS) {
        return Math.max(1, Math.ceil((WINDOW_MS - (time - bucket.startedAt)) / 1000));
      }
      bucket.count += 1;
      return 0;
    }
  };
}

export const agentLimiter = createAgentLimiter();

export type AgentGateFailure = { status: 401 | 403 | 429; error: string; headers: Record<string, string> };

/** 인증·권한·요청 제한을 한 번에 확인한다 (REST·MCP 공통) */
export async function requireAgent(req: Request, scope = BLOG_DRAFT_SCOPE): Promise<{ agent: AgentIdentity } | { failure: AgentGateFailure }> {
  const agent = await authenticateAgent(req);
  if (!agent) {
    return {
      failure: {
        status: 401,
        error: "유효한 에이전트 키가 필요합니다. Authorization: Bearer <키> 헤더를 보내 주세요.",
        headers: { "WWW-Authenticate": 'Bearer realm="opencollege-agent"' }
      }
    };
  }
  if (!hasScope(agent, scope)) {
    return { failure: { status: 403, error: `이 키에는 ${scope} 권한이 없습니다.`, headers: {} } };
  }
  const retryAfter = agentLimiter.consume(agent.id);
  if (retryAfter > 0) {
    return {
      failure: {
        status: 429,
        error: `요청이 너무 많습니다. ${retryAfter}초 후 다시 시도해 주세요. (키당 1분 30회)`,
        headers: { "Retry-After": String(retryAfter) }
      }
    };
  }
  return { agent };
}

/** 관리자 화면용 키 목록 — 해시는 내보내지 않는다 */
export async function listAgentKeys() {
  if (!hasDatabase) return [];
  return getDb()
    .select({
      id: agentKeys.id,
      name: agentKeys.name,
      keyPrefix: agentKeys.keyPrefix,
      scopes: agentKeys.scopes,
      createdAt: agentKeys.createdAt,
      lastUsedAt: agentKeys.lastUsedAt,
      revokedAt: agentKeys.revokedAt
    })
    .from(agentKeys)
    .orderBy(desc(agentKeys.createdAt));
}
