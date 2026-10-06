import { InquiryTable, type InquiryRow } from "@/components/admin/InquiryTable";
import { getAllInquiries, getAllInquiryNotes } from "@/lib/content";
import { INQUIRY_COURSES, InquiryAnalysisSchema } from "@/lib/inquiry-analysis";

export default async function InquiriesPage() {
  const [inquiries, inquiryNotes] = await Promise.all([getAllInquiries(), getAllInquiryNotes()]);
  const notesByInquiryId = inquiryNotes.reduce<Record<string, { id: string; body: string; createdAt: string }[]>>((notes, note) => {
    (notes[note.inquiryId] ??= []).push({ id: note.id, body: note.body, createdAt: note.createdAt });
    return notes;
  }, {});
  const rows: InquiryRow[] = inquiries.map((inquiry) => {
    const parsedAnalysis = InquiryAnalysisSchema.safeParse(inquiry.analysis);
    return {
      ...inquiry,
      analysis: parsedAnalysis.success ? parsedAnalysis.data : null,
      createdAt: inquiry.createdAt.toISOString(),
      analysisAt: inquiry.analysisAt?.toISOString() ?? null,
      notificationSentAt: inquiry.notificationSentAt?.toISOString() ?? null,
      notificationAttemptedAt: inquiry.notificationAttemptedAt?.toISOString() ?? null,
      processingLeaseUntil: inquiry.processingLeaseUntil?.toISOString() ?? null,
      notes: notesByInquiryId[inquiry.id] ?? []
    };
  });
  const newCount = rows.filter((row) => row.status === "new").length;

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">문의 관리</h1>
        <span style={{ color: "#6b7280", fontSize: 14 }}>총 {rows.length}건 · 새 문의 {newCount}건</span>
      </div>
      <div className="cms-card">
        <InquiryTable inquiries={rows} catalog={INQUIRY_COURSES} />
      </div>
    </>
  );
}
