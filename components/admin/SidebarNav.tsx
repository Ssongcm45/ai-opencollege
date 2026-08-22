"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin", label: "대시보드", icon: "▣", exact: true },
  { href: "/admin/blog", label: "블로그", icon: "✦" },
  { href: "/admin/categories", label: "카테고리", icon: "⊞" },
  { href: "/admin/cases", label: "출강사례", icon: "◈" },
  { href: "/admin/portfolio", label: "수강생 포트폴리오", icon: "◉" },
  { href: "/admin/inquiries", label: "문의 관리", icon: "✉" },
  { href: "/admin/checks", label: "AI학습체크", icon: "✓" },
  { href: "/admin/security", label: "보안", icon: "⛨" },
  { href: "/admin/settings", label: "설정", icon: "◎" }
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="cms-nav">
      {nav.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`cms-nav-link${isActive ? " on" : ""}`}>
            <span className="cms-nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
