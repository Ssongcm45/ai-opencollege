import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePortfolioItem, deletePortfolioItem } from "@/lib/actions";
import { getPortfolioById } from "@/lib/content";
import { ThumbnailUpload } from "@/components/admin/ThumbnailUpload";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getPortfolioById(id);
  if (!item) notFound();

  const updateAction = updatePortfolioItem.bind(null, id);
  const deleteAction = deletePortfolioItem.bind(null, id);

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">포트폴리오 수정</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <DeleteButton action={deleteAction} label="포트폴리오 삭제" />
          <Link href="/admin/portfolio" className="cms-btn cms-btn-cancel">← 목록으로</Link>
        </div>
      </div>

      <form action={updateAction} className="cms-card cms-form">
        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">유형 <em>*</em></label>
            <input className="cms-input" name="type" defaultValue={item.type} placeholder="예: OFFICE, CREATIVE, AGENT" required />
          </div>
          <div className="cms-field">
            <label className="cms-label">제목 <em>*</em></label>
            <input className="cms-input" name="title" defaultValue={item.title} required />
          </div>
        </div>

        <div className="cms-field">
          <label className="cms-label">설명 <em>*</em></label>
          <textarea className="cms-input cms-textarea" name="description" defaultValue={item.description} required />
        </div>

        <div className="cms-field">
          <label className="cms-label">대표 이미지</label>
          <ThumbnailUpload defaultValue={item.thumbnailUrl} />
        </div>

        <div className="cms-field">
          <label className="cms-label">영상 링크 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(YouTube 또는 Vimeo URL, 선택)</span></label>
          <input className="cms-input" name="videoUrl" defaultValue={item.videoUrl ?? ""} placeholder="예: https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..." />
        </div>

        <div className="cms-field">
          <label className="cms-label">정렬 순서</label>
          <input className="cms-input" name="order" type="number" defaultValue={item.order} />
        </div>

        <div className="cms-checks">
          <label className="cms-check">
            <input type="checkbox" name="published" defaultChecked={item.published} /> 공개
          </label>
        </div>

        <div className="cms-actions">
          <Link href="/admin/portfolio" className="cms-btn cms-btn-cancel">취소</Link>
          <button type="submit" className="cms-btn cms-btn-primary">저장</button>
        </div>
      </form>
    </>
  );
}
