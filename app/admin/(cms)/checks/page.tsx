import Link from "next/link";
import { createCheckGroup, deleteCheckGroup, toggleCheckGroup, updateCheckGroupExpiry } from "@/lib/check-actions";
import { getCheckGroupsWithCounts, getCheckTotals } from "@/lib/check-data";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { CheckLinkField } from "@/components/admin/CheckLinkField";

export default async function ChecksAdminPage() {
  const [groups, totals] = await Promise.all([getCheckGroupsWithCounts(), getCheckTotals()]);

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">AI학습체크 조직 진단</h1>
      </div>

      <div className="cms-card">
        <div className="cms-card-head">
          <span className="cms-card-title">진행 현황</span>
        </div>
        <div className="stat-figs">
          <div className="stat-fig">
            <div className="stat-fig-label">총 진행 수</div>
            <div className="stat-fig-num">{totals.total}</div>
          </div>
          <div className="stat-fig">
            <div className="stat-fig-label">개인 진단</div>
            <div className="stat-fig-num">{totals.individualCount}</div>
          </div>
          <div className="stat-fig">
            <div className="stat-fig-label">조직 응답</div>
            <div className="stat-fig-num">{totals.orgResponseCount}</div>
          </div>
          <div className="stat-fig">
            <div className="stat-fig-label">최근 30일</div>
            <div className="stat-fig-num">{totals.last30Days}</div>
          </div>
        </div>
      </div>

      <div className="cms-card">
        <div className="cms-card-head">
          <div>
            <span className="cms-card-title">조직 진단 생성</span>
            <p className="cms-hint">조직명으로 진단 그룹을 만들면 참여 링크가 자동 생성됩니다.</p>
          </div>
        </div>
        <form action={createCheckGroup} className="cms-form">
          <div className="cms-row2">
            <div>
              <label className="cms-label" htmlFor="expiresAt">응답 마감일</label>
              <input id="expiresAt" name="expiresAt" type="date" className="cms-input" />
              <p className="cms-hint">응답 마감일 (선택 · 비우면 무기한, 해당일 자정까지 유효)</p>
            </div>
            <input className="cms-input" name="name" placeholder="조직명 (예: OO기관 3팀)" required />
            <div className="cms-actions" style={{ justifyContent: "flex-start", marginTop: 0 }}>
              <button type="submit" className="cms-btn cms-btn-primary">생성</button>
            </div>
          </div>
        </form>
      </div>

      <div className="cms-card">
        {groups.length > 0 ? (
          <table className="cms-table">
            <thead>
              <tr>
                <th>마감일</th>
                <th>조직명</th>
                <th>참여 링크</th>
                <th>응답 수</th>
                <th>상태</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const toggleAction = toggleCheckGroup.bind(null, group.id);
                const deleteAction = deleteCheckGroup.bind(null, group.id);
                const expiryAction = updateCheckGroupExpiry.bind(null, group.id);
                const isExpired = group.expiresAt !== null && group.expiresAt.getTime() <= Date.now();
                const expiryDate = group.expiresAt
                  ? new Intl.DateTimeFormat("ko-KR", {
                    timeZone: "Asia/Seoul",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                  }).format(group.expiresAt)
                  : "무기한";
                const expiryInputValue = group.expiresAt
                  ? new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Asia/Seoul",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                  }).format(group.expiresAt)
                  : "";
                return (
                  <tr key={group.id}>
                    <td>
                      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{expiryDate}</div>
                      <form action={expiryAction} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="date" name="expiresAt" defaultValue={expiryInputValue} className="cms-input" style={{ fontSize: "0.8rem", width: "130px" }} />
                        <button type="submit" className="cms-del-btn" style={{ fontSize: 12 }}>저장</button>
                      </form>
                    </td>
                    <td>{group.name}</td>
                    <td style={{ minWidth: 260 }}>
                      <CheckLinkField url={`https://opencollege.co.kr/check/${group.code}`} />
                    </td>
                    <td style={{ fontSize: 13, color: "#6b7280" }}>{group.responseCount}</td>
                    <td>
                      <span className={`badge ${group.active ? "badge-green" : "badge-gray"}`} style={{ display: "none" }}>
                        {group.active ? "활성" : "중지"}
                      </span>
                      <span className={`badge ${group.active && !isExpired ? "badge-green" : "badge-gray"}`}>
                        {!group.active ? "중지" : isExpired ? "기간 종료" : "진행 중"}
                      </span>
                      <form action={toggleAction} style={{ display: "inline-block", marginLeft: 8 }}>
                        <button type="submit" className="cms-del-btn" style={{ fontSize: 12 }}>
                          {group.active ? "중지" : "활성"}
                        </button>
                      </form>
                    </td>
                    <td>
                      <Link href={`/admin/checks/${group.id}`} className="cms-btn cms-btn-cancel" style={{ fontSize: 13, padding: "6px 14px" }}>
                        통계
                      </Link>
                    </td>
                    <td><DeleteButton action={deleteAction} label="삭제" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="cms-empty">등록된 조직 진단이 없습니다. 위에서 조직명을 입력해 생성하세요.</p>
        )}
      </div>
    </>
  );
}
