import { eq } from "drizzle-orm";
import { getAuditLog } from "@/lib/audit";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig, type AdminAuditLog } from "@/lib/db/schema";

// 액션별 배지 색상: 실패/잠금/삭제 계열은 회색 강조, 그 외 성공 계열은 초록.
function badgeClass(action: string): string {
  if (action.startsWith("login.fail") || action === "login.locked" || action.endsWith(".delete")) {
    return "badge badge-gray";
  }
  return "badge badge-green";
}

async function getStatus() {
  if (!hasDatabase) {
    return { failedAttempts: 0, lockedUntil: null as Date | null, sessionVersion: 1, hasRow: false };
  }
  try {
    const [row] = await getDb().select().from(adminConfig).where(eq(adminConfig.id, 1)).limit(1);
    return {
      failedAttempts: row?.failedAttempts ?? 0,
      lockedUntil: row?.lockedUntil ?? null,
      sessionVersion: row?.sessionVersion ?? 1,
      hasRow: Boolean(row)
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: null as Date | null, sessionVersion: 1, hasRow: false };
  }
}

export default async function SecurityPage() {
  const [status, logs] = await Promise.all([getStatus(), getAuditLog(100)]);
  const locked = Boolean(status.lockedUntil && status.lockedUntil.getTime() > Date.now());

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">보안 로그</h1>
        <span style={{ fontSize: 14, color: "#6b7280" }}>최근 {logs.length}건</span>
      </div>

      {/* 현재 상태 */}
      <div className="cms-card">
        <div className="settings-section-title">현재 상태</div>
        <table className="cms-table">
          <tbody>
            <tr>
              <td style={{ fontWeight: 700, width: 200 }}>로그인 실패 카운트</td>
              <td>{status.failedAttempts}회</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>계정 잠금 상태</td>
              <td>
                {locked ? (
                  <span className="badge badge-gray">
                    잠김 · {status.lockedUntil?.toLocaleString("ko-KR")}까지
                  </span>
                ) : (
                  <span className="badge badge-green">정상</span>
                )}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>세션 버전</td>
              <td>v{status.sessionVersion}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 감사 로그 */}
      <div className="cms-card">
        <div className="settings-section-title">최근 활동 (최대 100건)</div>
        {logs.length > 0 ? (
          <table className="cms-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>작업</th>
                <th>상세</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: AdminAuditLog) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString("ko-KR")}</td>
                  <td>
                    <span className={badgeClass(log.action)}>{log.action}</span>
                  </td>
                  <td>{log.detail ?? "-"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{log.ip ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="cms-empty">아직 기록된 활동이 없습니다.</p>
        )}
      </div>
    </>
  );
}
