import Link from "next/link";
import { getAllPortfolioAdmin } from "@/lib/content";
import { deletePortfolioItem } from "@/lib/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function PortfolioAdminPage() {
  const items = await getAllPortfolioAdmin();

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">수강생 포트폴리오</h1>
        <Link href="/admin/portfolio/new" className="cms-btn cms-btn-primary">+ 새 포트폴리오 등록</Link>
      </div>

      <div className="cms-card">
        {items.length > 0 ? (
          <table className="cms-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>유형</th>
                <th>순서</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const deleteAction = deletePortfolioItem.bind(null, item.id);
                return (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/admin/portfolio/${item.id}`}>{item.title}</Link>
                    </td>
                    <td><span className="badge badge-gray">{item.type}</span></td>
                    <td style={{ fontSize: 13, color: "#6b7280" }}>{item.order}</td>
                    <td>
                      <span className={`badge ${item.published ? "badge-green" : "badge-gray"}`}>
                        {item.published ? "공개" : "비공개"}
                      </span>
                    </td>
                    <td><DeleteButton action={deleteAction} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="cms-empty">등록된 포트폴리오가 없습니다.</p>
        )}
      </div>
    </>
  );
}
