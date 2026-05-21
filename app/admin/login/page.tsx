import { loginAdmin, setupAdminPassword } from "@/lib/actions";
import { getDb, hasDatabase } from "@/lib/db";
import { adminConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getPasswordSet(): Promise<boolean> {
  if (!hasDatabase) return false;
  const rows = await getDb().select().from(adminConfig).where(eq(adminConfig.id, 1));
  return !!(rows[0]?.passwordHash);
}

export default async function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; setup?: string }>;
}) {
  const params = await searchParams;
  const isSetup = !await getPasswordSet() || params.setup === "1";

  const errorMsg =
    params.error === "mismatch" ? "비밀번호가 일치하지 않습니다." :
    params.error === "short" ? "비밀번호는 8자 이상이어야 합니다." :
    params.error === "email" ? "등록된 이메일이 아닙니다." :
    params.error === "nodb" ? "데이터베이스 연결이 필요합니다." :
    params.error === "1" ? "이메일 또는 비밀번호가 올바르지 않습니다." :
    null;

  return (
    <main className="admin-layout">
      <div className="wrap" style={{ maxWidth: 480 }}>
        <div className="form-card">
          <div className="ey">CMS LOGIN</div>
          <h1 className="sh2">{isSetup ? "비밀번호 설정" : "관리자 로그인"}</h1>
          {isSetup ? (
            <form action={setupAdminPassword} className="form-grid">
              <input className="input" type="email" name="email" placeholder="관리자 이메일" required />
              <input className="input" type="password" name="password" placeholder="새 비밀번호 (8자 이상)" required minLength={8} />
              <input className="input" type="password" name="confirm" placeholder="비밀번호 확인" required />
              <button className="btn bn btn-lg btn-pill">비밀번호 설정 후 로그인</button>
              {errorMsg && <p style={{ color: "var(--verm)", fontWeight: 800 }}>{errorMsg}</p>}
            </form>
          ) : (
            <form action={loginAdmin} className="form-grid">
              <input className="input" type="email" name="email" placeholder="관리자 이메일" required />
              <input className="input" type="password" name="password" placeholder="비밀번호" required />
              <button className="btn bn btn-lg btn-pill">로그인</button>
              {errorMsg && <p style={{ color: "var(--verm)", fontWeight: 800 }}>{errorMsg}</p>}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
