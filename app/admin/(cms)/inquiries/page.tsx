import { InquiryTable, type InquiryRow } from "@/components/admin/InquiryTable";
import { getAllInquiries } from "@/lib/content";

export default async function InquiriesPage() {
  const inquiries = await getAllInquiries();
  const rows: InquiryRow[] = inquiries.map((inquiry) => ({
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString()
  }));
  const newCount = rows.filter((row) => row.status === "new").length;

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">문의 관리</h1>
        <span style={{ color: "#6b7280", fontSize: 14 }}>총 {rows.length}건 · 새 문의 {newCount}건</span>
      </div>
      <div className="cms-card">
        <InquiryTable inquiries={rows} />
      </div>
    </>
  );
}
