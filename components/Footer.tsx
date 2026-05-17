export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="fmark">AI</div>
            <div className="fname">AI OpenCollege</div>
            <div className="fsub">opencollege.co.kr</div>
            <p className="fdesc">공공기관·기업·대학을 위한 AI 실무교육 전문기관. AIRO 플랫폼 기반 10개 트랙 교육. 이러닝 인증 보유 · 온라인평생교육원 설립 준비 중.</p>
          </div>
          <div className="fcol">
            <h4>교육과정</h4>
            <ul>
              <li><a href="/#courses">공공기관 출강</a></li>
              <li><a href="/#courses">기업 맞춤 교육</a></li>
              <li><a href="/#courses">개인·오픈 클래스</a></li>
              <li><a href="/#courses">K-Digital (준비중)</a></li>
            </ul>
          </div>
          <div className="fcol">
            <h4>트랙·자격증</h4>
            <ul>
              <li><a href="/#curriculum">Track A~E</a></li>
              <li><a href="/#curriculum">시니어 트랙</a></li>
              <li><a href="/#curriculum">취업준비 트랙</a></li>
              <li><a href="/#cert">자격증 (준비중)</a></li>
            </ul>
          </div>
          <div className="fcol">
            <h4>연락처</h4>
            <ul>
              <li><a href="tel:0507-1369-9224">0507-1369-9224</a></li>
              <li><a href="mailto:edu@opencollege.co.kr">edu@opencollege.co.kr</a></li>
              <li>경기도 평택시</li>
            </ul>
          </div>
        </div>
        <div className="foot-bot">
          <span>© 2026 AI OpenCollege · opencollege.co.kr</span>
          <div className="flinks"><a href="#">개인정보처리방침</a><a href="#">이용약관</a></div>
        </div>
      </div>
    </footer>
  );
}
