import { createCategory, deleteCategory } from "@/lib/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { DEFAULT_CATEGORIES, getCategoryRows, type CategoryScope } from "@/lib/content";

const categorySections: { scope: CategoryScope; heading: string; hint: string }[] = [
  { scope: "blog", heading: "블로그 카테고리", hint: "블로그 글 작성 시 선택할 수 있는 카테고리입니다." },
  { scope: "case", heading: "출강사례 유형", hint: "출강사례 등록 시 선택할 수 있는 유형입니다." },
  { scope: "portfolio", heading: "포트폴리오 유형", hint: "수강생 포트폴리오 등록 시 선택할 수 있는 유형입니다." }
];

export default async function CategoriesPage() {
  const [blogCategories, caseCategories, portfolioCategories] = await Promise.all([
    getCategoryRows("blog"),
    getCategoryRows("case"),
    getCategoryRows("portfolio")
  ]);
  const rowsByScope = {
    blog: blogCategories,
    case: caseCategories,
    portfolio: portfolioCategories
  };

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">카테고리 관리</h1>
      </div>

      {categorySections.map(({ scope, heading, hint }) => {
        const rows = rowsByScope[scope];
        return (
          <section className="cms-card" key={scope}>
            <div className="cms-card-head">
              <div>
                <span className="cms-card-title">{heading}</span>
                <p className="cms-hint">{hint}</p>
              </div>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>{rows.length}개</span>
            </div>

            {rows.length > 0 ? (
              <table className="cms-table">
                <thead>
                  <tr><th>이름</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map((category) => {
                    const deleteAction = deleteCategory.bind(null, category.id);
                    return (
                      <tr key={category.id}>
                        <td><span className="badge badge-gray">{category.name}</span></td>
                        <td><DeleteButton action={deleteAction} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="cms-empty">등록된 카테고리가 없습니다. 기본값({DEFAULT_CATEGORIES[scope].join(", ")})이 사용됩니다.</p>
            )}

            <form action={createCategory} className="cms-form" style={{ marginTop: 20 }}>
              <input name="scope" type="hidden" value={scope} />
              <div className="cms-row2">
                <input className="cms-input" name="name" placeholder={`${heading} 이름`} required />
                <div className="cms-actions" style={{ justifyContent: "flex-start", marginTop: 0 }}>
                  <button type="submit" className="cms-btn cms-btn-primary">추가</button>
                </div>
              </div>
            </form>
          </section>
        );
      })}
    </>
  );
}
