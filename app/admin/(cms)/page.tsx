import Link from "next/link";
import { getAuditLog } from "@/lib/audit";
import { getCheckTotals } from "@/lib/check-data";
import { getAllPortfolioAdmin, getCmsData } from "@/lib/content";

function getStatusBadge(status: string) {
  if (status === "new") return <span className="inq-badge-new">신규</span>;
  if (status === "replied") return <span className="badge badge-green">회신완료</span>;
  return <span className="badge badge-gray">{status === "archived" ? "보관" : "확인"}</span>;
}

export default async function DashboardPage() {
  const [{ posts, cases, inquiries }, portfolio, checkTotals, auditRows] = await Promise.all([
    getCmsData(),
    getAllPortfolioAdmin(),
    getCheckTotals(),
    getAuditLog(5)
  ]);
  const newCount = inquiries.filter((inq) => inq.status === "new").length;
  const dayRows = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      key: date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }),
      count: 0
    };
  });
  const daysByKey = new Map(dayRows.map((day) => [day.key, day]));
  inquiries.forEach((inq) => {
    const day = daysByKey.get(new Date(inq.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }));
    if (day) day.count += 1;
  });
  const maxDayCount = Math.max(...dayRows.map((day) => day.count), 1);

  return (
    <>
      <div className="cms-header"><h1 className="cms-page-title">대시보드</h1></div>

      <div className="cms-stats six">
        <div className="cms-stat-box"><div className="cms-stat-label">블로그 글</div><div className="cms-stat-num">{posts.length}</div></div>
        <div className="cms-stat-box"><div className="cms-stat-label">출강사례</div><div className="cms-stat-num">{cases.length}</div></div>
        <div className="cms-stat-box"><div className="cms-stat-label">수강생 포트폴리오</div><div className="cms-stat-num">{portfolio.length}</div></div>
        <div className="cms-stat-box"><div className="cms-stat-label">전체 문의</div><div className="cms-stat-num">{inquiries.length}</div></div>
        <div className="cms-stat-box"><div className="cms-stat-label">새 문의</div><div className="cms-stat-num" style={{ color: newCount > 0 ? "var(--verm)" : undefined }}>{newCount}</div></div>
        <div className="cms-stat-box"><div className="cms-stat-label">학습체크 진행</div><div className="cms-stat-num">{checkTotals.total}</div><div className="cms-stat-sub">최근 30일 {checkTotals.last30Days}</div></div>
      </div>

      <div className="cms-card">
        <div className="cms-card-head"><span className="cms-card-title">빠른 작업</span></div>
        <div className="cms-actions">
          <Link href="/admin/blog/new" className="cms-btn cms-btn-primary">+ 새 블로그 글</Link>
          <Link href="/admin/portfolio/new" className="cms-btn cms-btn-primary">+ 새 포트폴리오</Link>
          <Link href="/admin/cases/new" className="cms-btn cms-btn-cancel">+ 새 출강사례</Link>
          <Link href="/admin/checks" className="cms-btn cms-btn-cancel">조직 진단 만들기</Link>
        </div>
      </div>

      <div className="cms-card">
        <div className="cms-card-head"><span className="cms-card-title">최근 7일 문의 추이</span></div>
        <div className="dash-bars">
          {dayRows.map((day) => (
            <div key={day.key} className="dash-bar">
              <span className="dash-bar-count">{day.count}</span>
              <span className="dash-bar-fill" style={{ height: `${(day.count / maxDayCount) * 100}%` }} />
              <span className="dash-bar-label">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cms-card">
        <div className="cms-card-head"><span className="cms-card-title">최근 문의</span><Link href="/admin/inquiries" className="cms-link">전체 보기 →</Link></div>
        {inquiries.slice(0, 5).map((inq) => (
          <div key={inq.id} className="cms-list-row">
            <div>
              <Link href="/admin/inquiries" className="cms-list-title">{inq.name}{inq.organization ? ` · ${inq.organization}` : ""}</Link>
              <span style={{ color: "#9ca3af", fontSize: 12, marginLeft: 8 }}>{new Date(inq.createdAt).toLocaleString("ko-KR")}</span>
            </div>
            {getStatusBadge(inq.status)}
          </div>
        ))}
        {!inquiries.length && <p className="cms-empty">아직 문의가 없습니다.</p>}
      </div>

      <div className="cms-dash-grid">
        <div className="cms-card">
          <div className="cms-card-head"><span className="cms-card-title">최근 블로그</span><Link href="/admin/blog" className="cms-link">관리 →</Link></div>
          {posts.slice(0, 5).map((post) => (
            <div key={post.id} className="cms-list-row"><Link href={`/admin/blog/${post.id}`} className="cms-list-title">{post.title}</Link><span className={`badge ${post.published ? "badge-green" : "badge-gray"}`}>{post.published ? "공개" : "비공개"}</span></div>
          ))}
          {!posts.length && <p className="cms-empty">글이 없습니다.</p>}
        </div>
        <div className="cms-card">
          <div className="cms-card-head"><span className="cms-card-title">수강생 포트폴리오</span><Link href="/admin/portfolio" className="cms-link">관리 →</Link></div>
          {portfolio.slice(0, 5).map((item) => (
            <div key={item.id} className="cms-list-row"><Link href={`/admin/portfolio/${item.id}`} className="cms-list-title">{item.title}</Link><span className={`badge ${item.published ? "badge-green" : "badge-gray"}`}>{item.published ? "공개" : "비공개"}</span></div>
          ))}
          {!portfolio.length && <p className="cms-empty">등록된 포트폴리오가 없습니다.</p>}
        </div>
      </div>

      <div className="cms-card">
        <div className="cms-card-head"><span className="cms-card-title">최근 보안 이벤트</span><Link href="/admin/security" className="cms-link">전체 보기 →</Link></div>
        {auditRows.map((row) => (
          <div key={row.id} className="cms-list-row"><span>{new Date(row.createdAt).toLocaleString("ko-KR")}</span><span className="badge badge-gray">{row.action}</span><span>{row.detail ?? "-"}</span><span>{row.ip ?? "-"}</span></div>
        ))}
        {!auditRows.length && <p className="cms-empty">최근 보안 이벤트가 없습니다.</p>}
      </div>
    </>
  );
}
