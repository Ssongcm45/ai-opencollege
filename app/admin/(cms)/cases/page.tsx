import Link from "next/link";
import { getAllCasesAdmin } from "@/lib/content";
import { deleteCase } from "@/lib/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function CasesAdminPage() {
  const cases = await getAllCasesAdmin();

  return (
    <>
      <div className="cms-header">
        <h1 className="cms-page-title">출강사례</h1>
        <Link href="/admin/cases/new" className="cms-btn cms-btn-primary">+ 새 사례 등록</Link>
      </div>

      <div className="cms-card">
        {cases.length > 0 ? (
          <table className="cms-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>유형</th>
                <th>시간</th>
                <th>순서</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const deleteAction = deleteCase.bind(null, c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/cases/${c.id}`}>{c.title}</Link>
                      <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>{c.slug}</div>
                    </td>
                    <td><span className="badge badge-gray">{c.clientType}</span></td>
                    <td style={{ fontSize: 13, color: "#374151" }}>{c.hours}</td>
                    <td style={{ fontSize: 13, color: "#6b7280" }}>{c.order}</td>
                    <td>
                      <span className={`badge ${c.published ? "badge-green" : "badge-gray"}`}>
                        {c.published ? "공개" : "비공개"}
                      </span>
                    </td>
                    <td><DeleteButton action={deleteAction} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="cms-empty">등록된 출강사례가 없습니다.</p>
        )}
      </div>
    </>
  );
}
