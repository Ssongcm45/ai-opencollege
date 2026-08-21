import Link from "next/link";
import { createCase } from "@/lib/actions";
import { TuiEditor } from "@/components/admin/TuiEditor";
import { ThumbnailUpload } from "@/components/admin/ThumbnailUpload";
import { getCategories } from "@/lib/content";

export default async function NewCasePage() {
  const clientTypes = await getCategories("case");
  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">새 출강사례 등록</h1>
        <Link href="/admin/cases" className="cms-btn cms-btn-cancel">← 목록으로</Link>
      </div>

      <form action={createCase} className="cms-card cms-form">
        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">제목 <em>*</em></label>
            <input className="cms-input" name="title" placeholder="출강사례 제목" required />
          </div>
          <div className="cms-field">
            <label className="cms-label">슬러그 <em>*</em></label>
            <input className="cms-input" name="slug" placeholder="예: public-ai-literacy" required />
          </div>
        </div>

        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">유형 <em>*</em></label>
            <select className="cms-input" name="clientType" required>
              {clientTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="cms-field">
            <label className="cms-label">교육 시간 <em>*</em></label>
            <input className="cms-input" name="hours" placeholder="예: 8시간" required />
          </div>
        </div>

        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">정렬 순서</label>
            <input className="cms-input" name="order" type="number" defaultValue={0} />
          </div>
          <div className="cms-field">
            <label className="cms-label">요약 <em>*</em><span style={{ color: "#9ca3af", fontWeight: 400 }}> (SEO meta description 자동 사용)</span></label>
            <input className="cms-input" name="summary" placeholder="한 줄 요약" required />
          </div>
        </div>

        <div className="cms-field">
          <label className="cms-label">영상 링크 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(YouTube 또는 Vimeo URL, 선택)</span></label>
          <input className="cms-input" name="videoUrl" placeholder="예: https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..." />
        </div>

        <div className="cms-field">
          <label className="cms-label">대표 이미지 (썸네일)</label>
          <ThumbnailUpload />
        </div>

        <div className="cms-field">
          <label className="cms-label">본문 <em>*</em></label>
          <TuiEditor name="content" />
        </div>

        <div className="cms-checks">
          <label className="cms-check">
            <input type="checkbox" name="published" defaultChecked /> 공개
          </label>
        </div>

        <div className="cms-actions">
          <Link href="/admin/cases" className="cms-btn cms-btn-cancel">취소</Link>
          <button type="submit" className="cms-btn cms-btn-primary">저장</button>
        </div>
      </form>
    </>
  );
}
