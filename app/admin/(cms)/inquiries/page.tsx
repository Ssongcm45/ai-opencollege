import { InquiryTable, type InquiryRow } from "@/components/admin/InquiryTable";
import { getAllInquiries, getAllInquiryNotes } from "@/lib/content";

export default async function InquiriesPage() {
  const [inquiries, inquiryNotes] = await Promise.all([getAllInquiries(), getAllInquiryNotes()]);
  const notesByInquiryId = inquiryNotes.reduce<Record<string, { id: string; body: string; createdAt: string }[]>>((notes, note) => {
    (notes[note.inquiryId] ??= []).push({ id: note.id, body: note.body, createdAt: note.createdAt });
    return notes;
  }, {});
  const rows: InquiryRow[] = inquiries.map((inquiry) => ({
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
    notes: notesByInquiryId[inquiry.id] ?? []
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
