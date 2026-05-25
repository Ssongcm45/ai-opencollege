import Link from "next/link";
import { getCmsData } from "@/lib/content";

export default async function DashboardPage() {
  const { posts, cases, inquiries } = await getCmsData();
  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">대시보드</h1>
      </div>

      <div className="cms-stats">
        <div className="cms-stat-box">
          <div className="cms-stat-label">블로그 글</div>
          <div className="cms-stat-num">{posts.length}</div>
        </div>
        <div className="cms-stat-box">
          <div className="cms-stat-label">수강생 포트폴리오</div>
          <div className="cms-stat-num">{cases.length}</div>
        </div>
        <div className="cms-stat-box">
          <div className="cms-stat-label">전체 문의</div>
          <div className="cms-stat-num">{inquiries.length}</div>
        </div>
        <div className="cms-stat-box">
          <div className="cms-stat-label">새 문의</div>
          <div className="cms-stat-num" style={{ color: newCount > 0 ? "var(--verm)" : undefined }}>
            {newCount}
          </div>
        </div>
      </div>

      <div className="cms-card">
        <div className="cms-card-head">
          <span className="cms-card-title">최근 문의</span>
          <Link href="/admin/inquiries" className="cms-link">전체 보기 →</Link>
        </div>
        {inquiries.slice(0, 5).map((inq) => (
          <div key={inq.id} className="inq-row">
            <div className="inq-top">
              <span className="inq-name">{inq.name}</span>
              {inq.status === "new" && <span className="inq-badge-new">NEW</span>}
            </div>
            <div className="inq-meta">
              {[inq.organization, inq.phone, inq.email].filter(Boolean).join(" · ")}
            </div>
            <div className="inq-msg">{inq.message}</div>
          </div>
        ))}
        {!inquiries.length && <p className="cms-empty">아직 문의가 없습니다.</p>}
      </div>

      <div className="cms-dash-grid">
        <div className="cms-card">
          <div className="cms-card-head">
            <span className="cms-card-title">최근 블로그</span>
            <Link href="/admin/blog" className="cms-link">관리 →</Link>
          </div>
          {posts.slice(0, 5).map((p) => (
            <div key={p.id} className="cms-list-row">
              <Link href={`/admin/blog/${p.id}`} className="cms-list-title">{p.title}</Link>
              <span className={`badge ${p.published ? "badge-green" : "badge-gray"}`}>
                {p.published ? "공개" : "비공개"}
              </span>
            </div>
          ))}
          {!posts.length && <p className="cms-empty">글이 없습니다.</p>}
        </div>
        <div className="cms-card">
          <div className="cms-card-head">
            <span className="cms-card-title">수강생 포트폴리오</span>
            <Link href="/admin/portfolio" className="cms-link">관리 →</Link>
          </div>
          {cases.slice(0, 5).map((c) => (
            <div key={c.id} className="cms-list-row">
              <Link href={`/admin/portfolio/${c.id}`} className="cms-list-title">{c.title}</Link>
              <span className={`badge ${c.published ? "badge-green" : "badge-gray"}`}>
                {c.published ? "공개" : "비공개"}
              </span>
            </div>
          ))}
          {!cases.length && <p className="cms-empty">등록된 포트폴리오가 없습니다.</p>}
        </div>
      </div>
    </>
  );
}
