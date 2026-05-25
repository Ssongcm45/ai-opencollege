import { getAllInquiries } from "@/lib/content";
import { markInquiryRead } from "@/lib/actions";

export default async function InquiriesPage() {
  const inquiries = await getAllInquiries();

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">문의 관리</h1>
        <span style={{ fontSize: 14, color: "#6b7280" }}>
          총 {inquiries.length}건 · 새 문의 {inquiries.filter((i) => i.status === "new").length}건
        </span>
      </div>

      <div className="cms-card">
        {inquiries.length > 0 ? (
          inquiries.map((inq) => {
            const readAction = markInquiryRead.bind(null, inq.id);
            return (
              <div key={inq.id} className="inq-row">
                <div className="inq-top">
                  <span className="inq-name">{inq.name}</span>
                  {inq.status === "new" && <span className="inq-badge-new">NEW</span>}
                  <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 12 }}>
                    {new Date(inq.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="inq-meta">
                  {[inq.organization, inq.phone, inq.email, inq.audience && `대상: ${inq.audience}`]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                <div className="inq-msg">{inq.message}</div>
                {inq.status === "new" && (
                  <form action={readAction} style={{ marginTop: 10 }}>
                    <button type="submit" className="cms-del-btn" style={{ fontSize: 12 }}>
                      읽음 처리
                    </button>
                  </form>
                )}
              </div>
            );
          })
        ) : (
          <p className="cms-empty">아직 문의가 없습니다.</p>
        )}
      </div>
    </>
  );
}
