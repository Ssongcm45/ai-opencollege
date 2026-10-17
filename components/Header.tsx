import { GuideModal } from "@/components/GuideModal";

export function Header() {
  return (
    <>
<header className="site-header">
        <div className="wrap">
          <div className="header-in">
            <a href="/" className="logo">
              <div className="lmark"><img src="/logo-96.png" alt="AI OpenCollege 로고" width={40} height={40} decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
              <div>
                <div className="lname">AI OpenCollege</div>
                <div className="lsub">opencollege.co.kr</div>
              </div>
            </a>
            <nav className="nav-links">
              <a href="/courses">과정소개</a>
              <a href="/airo">AIRO 시스템</a>
              <a href="/cases">출강사례</a>
              <a href="/portfolio">수강생작품</a>
              <a href="/blog">블로그</a>
              <GuideModal />
              <a href="/#faq">FAQ</a>
            </nav>
            <div className="hcta">
              <a href="/check" className="btn bo btn-pill">AI학습체크</a>
              <a href="/#contact" className="btn bp btn-pill">교육 문의</a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
