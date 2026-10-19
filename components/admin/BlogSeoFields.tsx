import { ThumbnailUpload } from "@/components/admin/ThumbnailUpload";
import { canonicalHint } from "@/lib/blog-seo";
import type { BlogPost } from "@/lib/db/schema";

type SeoValues = Partial<Pick<BlogPost, "seoTitle" | "seoDescription" | "seoKeywords" | "ogImage" | "canonicalUrl" | "noindex">>;

// 블로그 편집 화면의 SEO 설정 카드. 비워 두면 제목·요약·썸네일·기본 주소를 그대로 쓴다.
export function BlogSeoFields({ post }: { post?: SeoValues }) {
  return (
    <fieldset className="cms-field" style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
      <legend className="cms-label" style={{ padding: "0 6px" }}>
        SEO 설정 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(선택 · 비우면 제목·요약·썸네일을 사용)</span>
      </legend>

      <div className="cms-row2">
        <div className="cms-field">
          <label className="cms-label">검색 제목</label>
          <input className="cms-input" name="seoTitle" maxLength={200} defaultValue={post?.seoTitle ?? ""} placeholder="비우면 글 제목" />
        </div>
        <div className="cms-field">
          <label className="cms-label">키워드 <span style={{ color: "#9ca3af", fontWeight: 400 }}>(쉼표로 구분)</span></label>
          <input className="cms-input" name="seoKeywords" maxLength={500} defaultValue={post?.seoKeywords ?? ""} placeholder="예: AI 교육, 공공기관 출강" />
        </div>
      </div>

      <div className="cms-field">
        <label className="cms-label">검색 설명</label>
        <textarea className="cms-textarea" name="seoDescription" maxLength={500} rows={2} defaultValue={post?.seoDescription ?? ""} placeholder="비우면 요약" />
      </div>

      <div className="cms-field">
        <label className="cms-label">공유 이미지 (OG) <span style={{ color: "#9ca3af", fontWeight: 400 }}>(비우면 썸네일)</span></label>
        <ThumbnailUpload name="ogImage" defaultValue={post?.ogImage} />
      </div>

      <div className="cms-field">
        <label className="cms-label">대표 주소 (canonical)</label>
        <input className="cms-input" name="canonicalUrl" maxLength={500} defaultValue={post?.canonicalUrl ?? ""} placeholder={`비우면 이 글 주소 · ${canonicalHint()} 만 허용`} />
      </div>

      <label className="cms-check">
        <input type="checkbox" name="noindex" defaultChecked={post?.noindex ?? false} /> 검색엔진 색인 제외 (사이트맵·llms.txt 에서도 빠짐)
      </label>
    </fieldset>
  );
}
