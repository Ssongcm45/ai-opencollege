import Link from "next/link";
import { getAllPostsAdmin } from "@/lib/content";
import { deletePost } from "@/lib/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function BlogAdminPage() {
  const posts = await getAllPostsAdmin();

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">블로그</h1>
        <Link href="/admin/blog/new" className="cms-btn cms-btn-primary">+ 새 글 작성</Link>
      </div>

      <div className="cms-card">
        {posts.length > 0 ? (
          <table className="cms-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>작성일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const deleteAction = deletePost.bind(null, post.id);
                return (
                  <tr key={post.id}>
                    <td>
                      <Link href={`/admin/blog/${post.id}`}>{post.title}</Link>
                      <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{post.slug}</div>
                    </td>
                    <td><span className="badge badge-gray">{post.category}</span></td>
                    <td>
                      <span className={`badge ${post.published ? "badge-green" : "badge-gray"}`}>
                        {post.published ? "공개" : "비공개"}
                      </span>
                    </td>
                    <td style={{ color: "#6b7280", fontSize: 13 }}>
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td><DeleteButton action={deleteAction} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="cms-empty">등록된 블로그 글이 없습니다.</p>
        )}
      </div>
    </>
  );
}
