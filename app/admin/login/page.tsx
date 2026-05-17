import { loginAdmin } from "@/lib/actions";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="admin-layout">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div className="form-card">
          <div className="ey">CMS LOGIN</div>
          <h1 className="sh2">관리자 로그인</h1>
          <p className="sdesc" style={{ marginBottom: 24 }}>`.env`의 ADMIN_PASSWORD로 로그인합니다.</p>
          <form action={loginAdmin} className="form-grid">
            <input className="input" type="password" name="password" placeholder="관리자 비밀번호" required />
            <button className="btn bn btn-lg btn-pill">로그인</button>
            {params.error ? <p style={{ color: "var(--verm)", fontWeight: 800 }}>비밀번호가 올바르지 않습니다.</p> : null}
          </form>
        </div>
      </div>
    </main>
  );
}
