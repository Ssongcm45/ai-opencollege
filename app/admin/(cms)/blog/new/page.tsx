import Link from "next/link";
import { createPost } from "@/lib/actions";
import { getCategories } from "@/lib/content";
import { TuiEditor } from "@/components/admin/TuiEditor";
import { ThumbnailUpload } from "@/components/admin/ThumbnailUpload";

export default async function NewPostPage() {
  const categories = await getCategories("blog");
  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">새 블로그 글</h1>
        <Link href="/admin/blog" className="cms-btn cms-btn-cancel">← 목록으로</Link>
      </div>

      <form action={createPost} className="cms-card cms-form">
        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">제목 <em>*</em></label>
            <input className="cms-input" name="title" placeholder="글 제목" required />
          </div>
          <div className="cms-field">
            <label className="cms-label">슬러그 <em>*</em></label>
            <input className="cms-input" name="slug" placeholder="예: ai-education-method" required />
          </div>
        </div>

        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">카테고리 <em>*</em></label>
            <select className="cms-input" name="category" required>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="cms-field">
            <label className="cms-label">요약 <em>*</em><span style={{ color: "#9ca3af", fontWeight: 400 }}> (SEO meta description 자동 사용)</span></label>
            <input className="cms-input" name="excerpt" placeholder="한 줄 요약 (검색 노출에 사용됩니다)" required />
          </div>
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
          <label className="cms-check">
            <input type="checkbox" name="featured" /> 대표 글
          </label>
        </div>

        <div className="cms-actions">
          <Link href="/admin/blog" className="cms-btn cms-btn-cancel">취소</Link>
          <button type="submit" className="cms-btn cms-btn-primary">저장</button>
        </div>
      </form>
    </>
  );
}
