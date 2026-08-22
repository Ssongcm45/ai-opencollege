import { desc } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb, hasDatabase } from "@/lib/db";
import { adminAuditLog, type AdminAuditLog } from "@/lib/db/schema";

// 요청 헤더에서 클라이언트 IP를 추출한다(x-forwarded-for 첫 항목).
async function clientIp(): Promise<string | null> {
  try {
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
    return ip ? ip.slice(0, 64) : null;
  } catch {
    return null;
  }
}

// 관리자 감사 로그 기록. 절대 throw 하지 않으며 DB 미연결 시 무동작.
export async function audit(action: string, detail?: string): Promise<void> {
  if (!hasDatabase) return;
  try {
    const ip = await clientIp();
    await getDb().insert(adminAuditLog).values({
      action: action.slice(0, 60),
      detail: detail ? detail.slice(0, 300) : null,
      ip
    });
  } catch {
    // 감사 로깅 실패가 본 동작을 막지 않도록 조용히 무시.
  }
}

// 최근 감사 로그 조회(관리자 보안 페이지용).
export async function getAuditLog(limit = 100): Promise<AdminAuditLog[]> {
  if (!hasDatabase) return [];
  try {
    return await getDb()
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}
