import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePost, deletePost } from "@/lib/actions";
import { getPostById } from "@/lib/content";
import { TuiEditor } from "@/components/admin/TuiEditor";
import { DeleteButton } from "@/components/admin/DeleteButton";

const CATEGORIES = ["METHOD", "FIELD NOTE", "TECH DOC", "CASE", "NEWS"];

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const updateAction = updatePost.bind(null, id);
  const deleteAction = deletePost.bind(null, id);

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">블로그 수정</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <DeleteButton action={deleteAction} label="글 삭제" />
          <Link href="/admin/blog" className="cms-btn cms-btn-cancel">← 목록으로</Link>
        </div>
      </div>

      <form action={updateAction} className="cms-card cms-form">
        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">제목 <em>*</em></label>
            <input className="cms-input" name="title" defaultValue={post.title} required />
          </div>
          <div className="cms-field">
            <label className="cms-label">슬러그 <em>*</em></label>
            <input className="cms-input" name="slug" defaultValue={post.slug} required />
          </div>
        </div>

        <div className="cms-row2">
          <div className="cms-field">
            <label className="cms-label">카테고리</label>
            <select className="cms-input" name="category" defaultValue={post.category}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="cms-field">
            <label className="cms-label">요약 <em>*</em><span style={{ color: "#9ca3af", fontWeight: 400 }}> (SEO meta description 자동 사용)</span></label>
            <input className="cms-input" name="excerpt" defaultValue={post.excerpt} required />
          </div>
        </div>

        <div className="cms-field">
          <label className="cms-label">본문</label>
          <TuiEditor name="content" defaultValue={post.content} />
        </div>

        <div className="cms-checks">
          <label className="cms-check">
            <input type="checkbox" name="published" defaultChecked={post.published} /> 공개
          </label>
          <label className="cms-check">
            <input type="checkbox" name="featured" defaultChecked={post.featured} /> 대표 글
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
