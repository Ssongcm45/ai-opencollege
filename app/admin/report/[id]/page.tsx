import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/PrintButton";
import { ReportView } from "@/components/admin/ReportView";
import { requireAdminSession } from "@/lib/auth";
import { getCheckGroupById, getGroupResponses, getGroupStats } from "@/lib/check-data";

export const metadata: Metadata = {
  title: "AI학습체크 조직 진단 리포트",
  robots: { index: false, follow: false }
};

export default async function OrgDiagnosticReportPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const group = await getCheckGroupById(id);
  if (!group) notFound();

  const [stats, responses] = await Promise.all([getGroupStats(group.id), getGroupResponses(group.id)]);
  const participants = responses.map((response) => ({
    name: response.name,
    department: response.department,
    position: response.position,
    finalLevel: response.finalLevel,
    validAverage: response.validAverage
  }));

  return (
    <div className="report">
      <PrintButton />
      <ReportView
        groupName={group.name}
        stats={stats}
        participants={participants}
        aiSummary={group.aiSummary}
        senderId="uag-oc"
      />
    </div>
  );
}
