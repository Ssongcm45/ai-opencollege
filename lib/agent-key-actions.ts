"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateAgentKey } from "@/lib/agent-auth";
import { audit } from "@/lib/audit";
import { requireAdminSession } from "@/lib/auth";
import { getDb, hasDatabase } from "@/lib/db";
import { agentKeys } from "@/lib/db/schema";

// 외부 AI 에이전트 키 발급·폐기 (관리자 전용). 원문 키는 발급 응답으로 한 번만 돌려주고 저장·기록하지 않는다.

export type CreateAgentKeyState = { ok: boolean; message?: string; name?: string; key?: string };

export async function createAgentKey(_: CreateAgentKeyState, formData: FormData): Promise<CreateAgentKeyState> {
  await requireAdminSession();
  if (!hasDatabase) return { ok: false, message: "데이터베이스 연결이 필요합니다." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "에이전트 이름을 입력해 주세요." };
  if (name.length > 100) return { ok: false, message: "에이전트 이름은 100자 이하여야 합니다." };

  const { key, prefix, hash } = generateAgentKey();
  await getDb().insert(agentKeys).values({ name, keyPrefix: prefix, keyHash: hash });
  await audit("agent-key.create", `${name} (${prefix}…)`);
  revalidatePath("/admin/agents");
  return { ok: true, name, key };
}

// 폐기 — 지우지 않고 revoked_at 을 남긴다. 폐기한 키는 즉시 401.
export async function revokeAgentKey(id: string) {
  await requireAdminSession();
  if (!hasDatabase) redirect("/admin/agents");
  const [row] = await getDb()
    .update(agentKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(agentKeys.id, id), isNull(agentKeys.revokedAt)))
    .returning({ name: agentKeys.name, keyPrefix: agentKeys.keyPrefix });
  if (row) await audit("agent-key.revoke", `${row.name} (${row.keyPrefix}…)`);
  redirect("/admin/agents");
}
