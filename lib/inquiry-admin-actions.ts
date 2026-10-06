"use server";

import { and, eq, isNull, lt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth";
import { getDb, hasDatabase } from "@/lib/db";
import { inquiries } from "@/lib/db/schema";
import { processInquiry } from "@/lib/inquiry-service";

export async function retryInquiryProcessing(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdminSession();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "올바르지 않은 문의 ID입니다." };
  if (!hasDatabase) return { ok: false, message: "데이터베이스 연결이 필요합니다." };
  const [row] = await getDb().select({
    analysisStatus: inquiries.analysisStatus,
    notificationStatus: inquiries.notificationStatus,
    processingLeaseUntil: inquiries.processingLeaseUntil,
  }).from(inquiries).where(eq(inquiries.id, id)).limit(1);
  if (!row) return { ok: false, message: "문의를 찾을 수 없습니다." };
  if (row.processingLeaseUntil && row.processingLeaseUntil > new Date())
    return { ok: false, message: "처리 중입니다. 잠시 후 다시 확인해 주세요." };
  if (row.notificationStatus === "uncertain")
    return { ok: false, message: "발송 여부가 불확실합니다. Resend에서 확인한 후 수동으로 처리해 주세요." };
  if (row.analysisStatus === "complete" && row.notificationStatus === "sent")
    return { ok: false, message: "분석과 알림이 이미 완료되었습니다." };
  if (row.analysisStatus === "not_requested" && row.notificationStatus === "not_requested") {
    const [activated] = await getDb().update(inquiries).set({ analysisStatus: "pending", notificationStatus: "pending" })
      .where(and(eq(inquiries.id, id), eq(inquiries.analysisStatus, "not_requested"), eq(inquiries.notificationStatus, "not_requested"),
        or(isNull(inquiries.processingLeaseUntil), lt(inquiries.processingLeaseUntil, new Date()))))
      .returning({ id: inquiries.id });
    if (!activated) return { ok: false, message: "문의 상태가 변경되었습니다. 새로고침 후 확인해 주세요." };
  }
  try {
    await processInquiry(id);
    revalidatePath("/admin/inquiries");
    return { ok: true, message: "재처리를 요청했습니다. 현재 상태를 확인해 주세요." };
  } catch (error) {
    console.error("[inquiry] admin retry failed");
    revalidatePath("/admin/inquiries");
    return { ok: false, message: "재처리 중 오류가 발생했습니다. 상태를 확인해 주세요." };
  }
}
