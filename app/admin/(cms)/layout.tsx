import { requireAdminSession } from "@/lib/auth";
import { logoutAdmin } from "@/lib/actions";
import { SidebarNav } from "@/components/admin/SidebarNav";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="cms-wrap">
      <aside className="cms-sidebar">
        <div className="cms-brand">
          <div className="cms-brand-name">AI OpenCollege</div>
          <div className="cms-brand-sub">관리자 CMS</div>
        </div>
        <SidebarNav />
        <div className="cms-sidebar-foot">
          <form action={logoutAdmin}>
            <button type="submit" className="cms-logout">로그아웃</button>
          </form>
        </div>
      </aside>
      <main className="cms-body">{children}</main>
    </div>
  );
}
