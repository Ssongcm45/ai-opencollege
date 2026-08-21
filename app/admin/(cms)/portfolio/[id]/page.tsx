import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCase, deleteCase } from "@/lib/actions";
import { getCaseById } from "@/lib/content";
import { TuiEditor } from "@/components/admin/TuiEditor";
import { DeleteButton } from "@/components/admin/DeleteButton";

const CLIENT_TYPES = ["공공", "기업", "청년", "크리에이터", "대학", "기타"];

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getCaseById(id);
  if (!item) notFound();

  const updateAction = updateCase.bind(null, id);
  const deleteAction = deleteCase.bind(null, id);

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">포트폴리오 수정</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <DeleteButton action={deleteAction} label="사례 삭제" />
          <Link href="/admin/portfolio" className="cms-btn cms-btn-cancel">← 목록으로</Link>
        </div>
      </div>

      <form action={updateAction} className="cms-card cms-form">
        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">제목 <em>*</em></label>
            <input className="cms-input" name="title" defaultValue={item.title} required />
          </div>
          <div className="cms-field">
            <label className="cms-label">슬러그 <em>*</em></label>
            <input className="cms-input" name="slug" defaultValue={item.slug} required />
          </div>
        </div>

        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">유형</label>
            <select className="cms-input" name="clientType" defaultValue={item.clientType}>
              {CLIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="cms-field">
            <label className="cms-label">교육 시간</label>
            <input className="cms-input" name="hours" defaultValue={item.hours} />
          </div>
        </div>

        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">정렬 순서</label>
            <input className="cms-input" name="order" type="number" defaultValue={item.order} />
          </div>
          <div className="cms-field">
            <label className="cms-label">요약 <em>*</em><span style={{ color: "#9ca3af", fontWeight: 400 }}> (SEO 자동 사용)</span></label>
            <input className="cms-input" name="summary" defaultValue={item.summary} required />
          </div>
        </div>

        <div className="cms-field">
          <label className="cms-label">영상 링크 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(YouTube 또는 Vimeo URL, 선택)</span></label>
          <input className="cms-input" name="videoUrl" defaultValue={item.videoUrl ?? ""} placeholder="예: https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..." />
        </div>

        <div className="cms-field">
          <label className="cms-label">본문</label>
          <TuiEditor name="content" defaultValue={item.content} />
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
