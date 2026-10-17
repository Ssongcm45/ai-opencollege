import { BUSINESS_INFO } from "@/lib/business-info";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="fmark"><img src="/logo-96.png" alt="AI OpenCollege" width={48} height={48} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
            <div className="fname">AI OpenCollege</div>
            <div className="fsub">opencollege.co.kr</div>
            <p className="fdesc">공공기관·기업·대학을 위한 AI 실무교육 전문기관. AIRO 플랫폼 기반 11개 트랙 교육. 이러닝 인증 보유 · 온라인평생교육원 설립 준비 중.</p>
          </div>
          <div className="fcol">
            <h4 aria-level={3}>교육과정</h4>
            <ul>
              <li><a href="/lp/public">공공기관 출강</a></li>
              <li><a href="/lp/company">기업 맞춤 교육</a></li>
              <li><a href="/check">AI 업무 역량 진단</a></li>
              <li><a href="/courses#types">개인·오픈 클래스</a></li>
              <li><a href="/courses#types">K-Digital (준비중)</a></li>
            </ul>
          </div>
          <div className="fcol">
            <h4 aria-level={3}>트랙·자격증</h4>
            <ul>
              <li><a href="/courses#tracks">Track A~E</a></li>
              <li><a href="/courses/foundation">시니어 트랙</a></li>
              <li><a href="/courses/job">취업준비 트랙</a></li>
              <li><a href="/courses/research-rnd">연구 R&amp;D 트랙</a></li>
              <li><a href="/#cert">자격증 (준비중)</a></li>
            </ul>
          </div>
          <div className="fcol">
            <h4 aria-level={3}>연락처</h4>
            <ul>
              <li><a href={`tel:${BUSINESS_INFO.phone}`}>{BUSINESS_INFO.phone}</a></li>
              <li><a href={`mailto:${BUSINESS_INFO.email}`}>{BUSINESS_INFO.email}</a></li>
              <li>경기도 평택시</li>
            </ul>
          </div>
        </div>
        <section className="business-disclosure" aria-label="사업자 정보">
          <strong>{BUSINESS_INFO.companyName}</strong><span>브랜드: {BUSINESS_INFO.brandName}</span>
          <span>사업자등록번호: {BUSINESS_INFO.businessRegistrationNumber}</span>
          <span>통신판매업 신고번호: {BUSINESS_INFO.ecommerceRegistrationNumber}</span>
          <span>전화번호: <a href={`tel:${BUSINESS_INFO.phone}`}>{BUSINESS_INFO.phone}</a></span>
        </section>
        <div className="foot-bot">
          <span>© 2026 {BUSINESS_INFO.brandName} · opencollege.co.kr</span>
          <div className="flinks"><a href="/privacy">개인정보처리방침</a><a href="/terms">이용약관</a></div>
        </div>
      </div>
    </footer>
  );
}
