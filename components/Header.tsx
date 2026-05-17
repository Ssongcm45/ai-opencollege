export function Header() {
  return (
    <>
<header className="site-header">
        <div className="wrap">
          <div className="header-in">
            <a href="/" className="logo">
              <div className="lmark">AI</div>
              <div>
                <div className="lname">AI OpenCollege</div>
                <div className="lsub">opencollege.co.kr</div>
              </div>
            </a>
            <nav className="nav-links">
              <a href="/#courses">교육과정</a>
              <a href="/#curriculum">커리큘럼</a>
              <a href="/#clients">출강사례</a>
              <a href="/#portfolio">작품</a>
              <a href="/#blog">블로그</a>
              <a href="/#faq">FAQ</a>
              <a href="/#contact">교육 신청</a>
              <a href="/admin">CMS</a>
            </nav>
            <div className="hcta">
              <a href="/#courses" className="btn bo btn-pill">교육과정 보기</a>
              <a href="/#contact" className="btn bp btn-pill">교육 문의</a>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
