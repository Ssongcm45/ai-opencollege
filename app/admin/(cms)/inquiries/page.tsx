import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteInquiry, setInquiryStatus } from "@/lib/actions";
import { getAllInquiries } from "@/lib/content";

const statuses = ["new", "read", "replied", "archived"] as const;

const statusLabels = {
  new: "신규",
  read: "확인",
  replied: "회신완료",
  archived: "보관"
};

function getStatusBadge(status: string) {
  if (status === "new") return <span className="inq-badge-new">신규</span>;
  if (status === "replied") return <span className="badge badge-green">회신완료</span>;
  return <span className="badge badge-gray">{status === "archived" ? "보관" : "확인"}</span>;
}

export default async function InquiriesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = statuses.find((value) => value === params.status);
  const q = params.q?.trim() ?? "";
  const inquiries = await getAllInquiries();
  const counts = {
    total: inquiries.length,
    new: inquiries.filter((inq) => inq.status === "new").length,
    read: inquiries.filter((inq) => inq.status === "read").length,
    replied: inquiries.filter((inq) => inq.status === "replied").length,
    archived: inquiries.filter((inq) => inq.status === "archived").length
  };
  const query = q.toLocaleLowerCase("ko-KR");
  const filteredInquiries = inquiries
    .filter((inq) => !status || inq.status === status)
    .filter((inq) => !query || [inq.name, inq.organization, inq.email, inq.phone]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase("ko-KR").includes(query)));
  const tabs: Array<{ label: string; status?: (typeof statuses)[number]; count: number }> = [
    { label: "전체", count: counts.total },
    ...statuses.map((value) => ({ label: statusLabels[value], status: value, count: counts[value] }))
  ];

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">문의 관리</h1>
        <span style={{ fontSize: 14, color: "#6b7280" }}>총 {counts.total}건 · 신규 {counts.new}건</span>
      </div>

      <div className="cms-card">
        <div className="cms-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.status ? `/admin/inquiries?status=${tab.status}` : "/admin/inquiries"}
              className={`cms-tab ${status === tab.status ? "on" : ""}`}
            >
              {tab.label} {tab.count}
            </Link>
          ))}
        </div>
        <form action="/admin/inquiries" method="get" className="cms-search">
          {status && <input type="hidden" name="status" value={status} />}
          <input className="cms-input" name="q" defaultValue={q} placeholder="이름·기관·이메일 검색" />
          <button type="submit" className="cms-btn cms-btn-cancel">검색</button>
        </form>
        {filteredInquiries.length > 0 ? (
          filteredInquiries.map((inq) => {
            const nextStatus = inq.status === "new" ? "read" : inq.status === "read" ? "replied" : inq.status === "replied" ? "archived" : null;
            const statusAction = nextStatus ? setInquiryStatus.bind(null, inq.id, nextStatus) : null;
            const deleteAction = deleteInquiry.bind(null, inq.id);
            const level = inq.message.match(/\[AI학습체크\] Level (\d)/)?.[1];

            return (
              <div key={inq.id} className="inq-row">
                <div className="inq-top">
                  <span className="inq-name">{inq.name}</span>
                  {getStatusBadge(inq.status)}
                  {inq.audience === "AI학습체크 문의" && <span className="badge badge-gray">AI학습체크</span>}
                  {level && <span className="badge-level">Level {level}</span>}
                  <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 12 }}>
                    {new Date(inq.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="inq-meta">
                  {inq.organization ?? "-"} · {inq.phone ? <a href={`tel:${inq.phone}`}>{inq.phone}</a> : "-"} · {inq.email ? <a href={`mailto:${inq.email}`}>{inq.email}</a> : "-"} · 대상: {inq.audience ?? "-"}
                </div>
                <div className="inq-msg">{inq.message}</div>
                <div className="inq-actions">
                  {statusAction && (
                    <form action={statusAction}>
                      <button type="submit" className="cms-btn cms-btn-cancel">
                        {inq.status === "new" ? "확인 처리" : inq.status === "read" ? "회신완료" : "보관"}
                      </button>
                    </form>
                  )}
                  <a href={`mailto:${inq.email ?? ""}`} className="cms-btn cms-btn-primary">메일 회신</a>
                  <DeleteButton action={deleteAction} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="cms-empty">선택한 조건에 맞는 문의가 없습니다.</p>
        )}
      </div>
    </>
  );
}
