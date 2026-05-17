import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAdmin, saveCase, savePost } from "@/lib/actions";
import { getCmsData } from "@/lib/content";
import { hasDatabase } from "@/lib/db";

export default async function AdminPage() {
  const jar = await cookies();
  if (jar.get("admin_session")?.value !== "ok") redirect("/admin/login");

  const { posts, cases, inquiries } = await getCmsData();

  return (
    <main className="admin-layout">
      <div className="wrap">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
          <div>
            <div className="ey">CMS</div>
            <h1 className="sh2">AI OpenCollege CMS</h1>
            <p className="sdesc">{hasDatabase ? "데이터베이스에 연결되어 저장 기능을 사용할 수 있습니다." : "DATABASE_URL이 없어 읽기 전용 기본 데이터가 표시됩니다."}</p>
          </div>
          <form action={logoutAdmin}><button className="btn bo btn-pill">로그아웃</button></form>
        </div>

        <div className="admin-grid">
          <section className="admin-card">
            <h2 className="tp-h">블로그 글 작성/수정</h2>
            <form action={savePost} className="form-grid">
              <input className="input" name="title" placeholder="제목" required />
              <input className="input" name="slug" placeholder="slug 예: ai-education-method" required />
              <input className="input" name="category" placeholder="카테고리 예: METHOD" required />
              <textarea className="textarea" name="excerpt" placeholder="요약" required />
              <textarea className="textarea" name="content" placeholder="본문" required />
              <label><input type="checkbox" name="published" defaultChecked /> 공개</label>
              <label><input type="checkbox" name="featured" /> 대표 글</label>
              <button className="btn bn btn-pill">블로그 저장</button>
            </form>
          </section>

          <section className="admin-card">
            <h2 className="tp-h">출강사례 작성/수정</h2>
            <form action={saveCase} className="form-grid">
              <input className="input" name="title" placeholder="사례 제목" required />
              <input className="input" name="slug" placeholder="slug 예: public-ai-literacy" required />
              <input className="input" name="clientType" placeholder="유형 예: 공공" required />
              <input className="input" name="hours" placeholder="시간 예: 300시간" required />
              <input className="input" name="order" type="number" placeholder="정렬 순서" defaultValue={0} />
              <textarea className="textarea" name="summary" placeholder="요약" required />
              <textarea className="textarea" name="content" placeholder="본문" required />
              <label><input type="checkbox" name="published" defaultChecked /> 공개</label>
              <button className="btn bn btn-pill">사례 저장</button>
            </form>
          </section>
        </div>

        <div className="admin-grid" style={{ marginTop: 16 }}>
          <section className="admin-card">
            <h2 className="tp-h">블로그 목록</h2>
            <div className="table-list">{posts.map((post) => <div className="table-item" key={post.slug}><b>{post.title}</b><p>{post.slug} · {post.category}</p></div>)}</div>
          </section>
          <section className="admin-card">
            <h2 className="tp-h">문의 목록</h2>
            <div className="table-list">{inquiries.length ? inquiries.map((item) => <div className="table-item" key={item.id}><b>{item.name}</b><p>{item.organization} · {item.phone} · {item.email}</p><p>{item.message}</p></div>) : <p className="tp-p">아직 문의가 없습니다.</p>}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
