import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 · 오픈컬리지",
  robots: { index: false, follow: true },
};

const shortcuts = [
  { href: "/courses", label: "과정소개", desc: "기업·공공기관·대학 맞춤 AI 실무교육" },
  { href: "/check", label: "AI학습체크", desc: "30문항으로 보는 AI 활용 역량 진단" },
  { href: "/blog", label: "블로그", desc: "AI 실무 인사이트와 교육 소식" },
  { href: "/#contact", label: "교육 문의", desc: "담당자가 직접 확인 후 회신드립니다" },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content">
        <section className="page-hero nf-hero">
          <div className="wrap">
            <p className="nf-code" aria-hidden="true">404</p>
            <p className="ey">PAGE NOT FOUND</p>
            <h1 className="sh2 sh2-lg">요청하신 페이지를 찾을 수 없습니다</h1>
            <p className="sdesc">주소가 잘못 입력되었거나, 페이지가 이동·삭제되었을 수 있습니다. 아래 메뉴에서 원하시는 정보를 찾아보세요.</p>
            <div className="nf-acts">
              <a href="/" className="btn bp btn-lg btn-pill">홈으로 가기</a>
              <a href="/#contact" className="btn bo btn-lg btn-pill">교육 문의하기</a>
            </div>
          </div>
        </section>
        <section className="sec nf-links">
          <div className="wrap">
            <ul className="nf-grid">
              {shortcuts.map((s) => (
                <li key={s.href}>
                  <a href={s.href} className="nf-card">
                    <strong>{s.label} <span aria-hidden="true">→</span></strong>
                    <span>{s.desc}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
