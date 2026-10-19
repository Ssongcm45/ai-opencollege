import { listAgentKeys } from "@/lib/agent-auth";
import { revokeAgentKey } from "@/lib/agent-key-actions";
import { siteUrl } from "@/lib/site";
import { AgentKeyManager } from "@/components/admin/AgentKeyManager";
import { DeleteButton } from "@/components/admin/DeleteButton";

// 외부 AI 에이전트 키 관리 — 허가한 에이전트만 블로그 초안(비공개)을 등록할 수 있다. 발행은 관리자만.
export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  return value ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "-";
}

export default async function AgentKeysPage() {
  const keys = await listAgentKeys().catch(() => []);

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">에이전트 키</h1>
        <span style={{ fontSize: 14, color: "#6b7280" }}>사용 중 {keys.filter((k) => !k.revokedAt).length}개</span>
      </div>

      <div className="cms-card">
        <div className="settings-section-title">새 키 발급</div>
        <p className="cms-hint" style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          키를 가진 에이전트는 블로그 글을 <strong>초안(비공개)</strong>으로만 등록·수정할 수 있습니다.
          공개(발행)는 블로그 관리 화면에서 미리보기로 확인한 뒤 직접 합니다. 에이전트마다 따로 발급하고, 쓰지 않거나 새어 나간 키는 바로 폐기하세요.
        </p>
        <AgentKeyManager />
      </div>

      <div className="cms-card">
        <div className="settings-section-title">연결 정보</div>
        <table className="cms-table">
          <tbody>
            <tr>
              <td style={{ fontWeight: 700, width: 200 }}>MCP 서버 (Streamable HTTP)</td>
              <td><code>{siteUrl}/api/mcp</code></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>REST API</td>
              <td><code>{siteUrl}/api/agent/blog/drafts</code></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>인증 헤더</td>
              <td><code>Authorization: Bearer oc_agent_…</code> · 키당 1분 30회</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="cms-card">
        <div className="settings-section-title">발급한 키</div>
        {keys.length > 0 ? (
          <table className="cms-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>키 앞자리</th>
                <th>상태</th>
                <th>발급</th>
                <th>마지막 사용</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td><code>{key.keyPrefix}…</code></td>
                  <td>
                    {key.revokedAt ? (
                      <span className="badge badge-gray">폐기 · {formatDate(key.revokedAt)}</span>
                    ) : (
                      <span className="badge badge-green">사용 중</span>
                    )}
                  </td>
                  <td style={{ color: "#6b7280", fontSize: 13 }}>{formatDate(key.createdAt)}</td>
                  <td style={{ color: "#6b7280", fontSize: 13 }}>{formatDate(key.lastUsedAt)}</td>
                  <td>{key.revokedAt ? null : <DeleteButton action={revokeAgentKey.bind(null, key.id)} label="폐기" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="cms-empty">발급한 키가 없습니다.</p>
        )}
      </div>
    </>
  );
}
