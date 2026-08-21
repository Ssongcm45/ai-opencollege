import Link from "next/link";
import { createPortfolioItem } from "@/lib/actions";
import { ThumbnailUpload } from "@/components/admin/ThumbnailUpload";
import { TuiEditor } from "@/components/admin/TuiEditor";
import { getCategories } from "@/lib/content";

export default async function NewPortfolioPage() {
  const types = await getCategories("portfolio");
  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">새 포트폴리오 등록</h1>
        <Link href="/admin/portfolio" className="cms-btn cms-btn-cancel">← 목록으로</Link>
      </div>

      <form action={createPortfolioItem} className="cms-card cms-form">
        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">유형 <em>*</em></label>
            <select className="cms-input" name="type" required>
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="cms-field">
            <label className="cms-label">제목 <em>*</em></label>
            <input className="cms-input" name="title" placeholder="포트폴리오 제목" required />
          </div>
        </div>

        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">정렬 순서</label>
            <input className="cms-input" name="order" type="number" defaultValue={0} />
          </div>
          <div className="cms-field">
            <label className="cms-label">영상 링크 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(YouTube 또는 Vimeo URL, 선택)</span></label>
            <input className="cms-input" name="videoUrl" placeholder="예: https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..." />
          </div>
        </div>

        <div className="cms-field">
          <label className="cms-label">대표 이미지</label>
          <ThumbnailUpload />
        </div>

        <div className="cms-field">
          <label className="cms-label">설명 <em>*</em></label>
          <TuiEditor name="description" />
        </div>

        <div className="cms-checks">
          <label className="cms-check">
            <input type="checkbox" name="published" defaultChecked /> 공개
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
