import { getDb, hasDatabase } from "@/lib/db";
import { blogCategories } from "@/lib/db/schema";
import { createCategory, deleteCategory } from "@/lib/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DEFAULT_CATEGORIES } from "@/lib/content";

async function getCategories() {
  if (!hasDatabase) return [];
  return getDb().select().from(blogCategories).orderBy(blogCategories.name);
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">블로그 카테고리</h1>
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr" }}>
        {/* 카테고리 목록 */}
        <div className="cms-card">
          <div className="cms-card-head">
            <span className="cms-card-title">등록된 카테고리</span>
            <span style={{ color: "#9ca3af", fontSize: 13 }}>{categories.length}개</span>
          </div>
          {categories.length > 0 ? (
            <table className="cms-table">
              <thead>
                <tr><th>카테고리명</th><th></th></tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const deleteAction = deleteCategory.bind(null, cat.id);
                  return (
                    <tr key={cat.id}>
                      <td><span className="badge badge-gray">{cat.name}</span></td>
                      <td><DeleteButton action={deleteAction} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="cms-empty">
              등록된 카테고리가 없습니다.<br />
              기본값({DEFAULT_CATEGORIES.join(", ")})이 사용됩니다.
            </p>
          )}
        </div>

        {/* 카테고리 추가 */}
        <div className="cms-card">
          <div className="cms-card-head">
            <span className="cms-card-title">카테고리 추가</span>
          </div>
          <form action={createCategory} className="cms-form">
            <div className="cms-field">
              <label className="cms-label">카테고리명 <em>*</em></label>
              <input
                className="cms-input"
                name="name"
                placeholder="예: CASE STUDY"
                required
              />
              <p className="cms-hint">자동으로 대문자로 저장됩니다.</p>
            </div>
            <div className="cms-actions" style={{ justifyContent: "flex-start" }}>
              <button type="submit" className="cms-btn cms-btn-primary">추가</button>
            </div>
          </form>

          <div style={{ marginTop: 24, borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>기본 카테고리 일괄 등록</p>
            <form action={seedDefaultCategories}>
              <button type="submit" className="cms-btn cms-btn-cancel" style={{ fontSize: 13 }}>
                기본값으로 초기화
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

async function seedDefaultCategories() {
  "use server";
  const { requireAdminSession } = await import("@/lib/auth");
  const { getDb } = await import("@/lib/db");
  const { blogCategories } = await import("@/lib/db/schema");
  const { redirect } = await import("next/navigation");
  const { DEFAULT_CATEGORIES } = await import("@/lib/content");

  await requireAdminSession();
  for (const name of DEFAULT_CATEGORIES) {
    await getDb().insert(blogCategories).values({ name }).onConflictDoNothing();
  }
  redirect("/admin/categories");
}
