import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InquiryForm } from "@/components/InquiryForm";
import { CourseTabs, CurriculumTabs } from "@/components/Tabs";
import { getPublishedCases, getPublishedPortfolio, getPublishedPosts } from "@/lib/content";
import { getVideoEmbed } from "@/lib/video";

export default async function HomePage() {
  const [posts, cases, portfolio] = await Promise.all([
    getPublishedPosts(),
    getPublishedCases(),
    getPublishedPortfolio()
  ]);

  return (
    <>
      <Header />
      <main>
        <section className="hero sec" id="top">
          <div className="wrap">
            <div className="hero-grid">
              <div className="hero-body">
                <div style={{ marginBottom: 20 }}>
                  <span className="badge bdw"><span className="dot" />정부·대학·기업을 위한 AI 실무교육</span>
                </div>
                <h1>AI 교육,<br />이제 <span className="ac">결과물</span>로<br />증명하세요.</h1>
                <p className="hero-desc">완전 기초부터 리더십, 강사 양성, 정규 교육과정까지.<br />명확한 정보 구조와 AIRO 기반 실습으로 바로 쓰는 역량을 만듭니다.</p>
                <div className="hero-acts">
                  <a href="#contact" className="btn bp btn-lg btn-pill">교육 문의하기</a>
                  <a href="#curriculum" className="btn bow btn-lg btn-pill">트랙 보기</a>
                </div>
                <div className="hero-chips">
                  {["출장 교육", "온라인 과정", "공공기관 특화", "맞춤 커리큘럼", "수료증 제공"].map((chip) => <span className="hero-chip" key={chip}>{chip}</span>)}
                </div>
              </div>
              <div className="hero-motion" aria-hidden="true">
                <div className="ai-orbit">
                  <div className="hero-beam" />
                  <div className="ai-core"><div><strong>AIRO</strong><span>Learning System</span></div></div>
                  <div className="orbit-card oc1"><b>기초 진단</b><span>수준별 트랙 배정</span></div>
                  <div className="orbit-card oc2"><b>실습 설계</b><span>업무 결과물 중심</span></div>
                  <div className="orbit-card oc3"><b>수료 관리</b><span>기관별 이력 정리</span></div>
                  <div className="orbit-card oc4"><b>학습 이력</b><span>과정별 수료 관리</span></div>
                </div>
              </div>
            </div>
            <div className="hero-stats">
              <div className="hs-item"><div className="hs-n">30<span className="hs-u">+</span></div><div className="hs-l">교육 기관·기업</div></div>
              <div className="hs-item"><div className="hs-n">10<span className="hs-u">개</span></div><div className="hs-l">수준별 교육 트랙</div></div>
              <div className="hs-item"><div className="hs-n">100<span className="hs-u">%</span></div><div className="hs-l">실습 기반 수업</div></div>
              <div className="hs-item"><div className="hs-n">1:1</div><div className="hs-l">기관 맞춤 설계</div></div>
            </div>
          </div>
        </section>

        <section className="why sec">
          <div className="wrap why-grid">
            <div className="why-left">
              <div className="ey">WHY AI OPENCOLLEGE</div>
              <h2 className="sh2 sh2-lg">AI를 배웠는데<br />쓰지 못하면<br />의미가 없습니다.</h2>
              <p>이론 강의, 유튜브, 혼자 해보는 실습. 다 해봤지만 실제 업무에 적용이 안 됩니다. <strong>AI OpenCollege는 다릅니다.</strong></p>
              <p>수강자의 직무와 실제 업무 케이스를 기반으로 설계합니다. <strong>교육이 끝나는 날, 완성된 결과물을 손에 쥐고 나갑니다.</strong></p>
              <div className="hero-acts" style={{ marginTop: 32 }}>
                <a href="#contact" className="btn bn btn-pill">교육 문의 →</a>
                <a href="#curriculum" className="btn bo btn-pill">커리큘럼 보기</a>
              </div>
            </div>
            <div className="why-cards">
              {[
                {
                  title: "100% 실습 기반",
                  desc: "이론 없이 내 업무 케이스에 바로 적용합니다. 슬라이드가 아닌 결과물을 만드는 수업입니다.",
                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12 7H17L13.5 10L15 15L10 12L5 15L6.5 10L3 7H8L10 2Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                },
                {
                  title: "10개 트랙 맞춤 설계",
                  desc: "사무직·크리에이터·리더·교육자·시니어·취준생까지. 역할에 맞는 AI 활용법을 배웁니다.",
                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.6"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.6"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.6"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.6"/></svg>
                },
                {
                  title: "AIRO 플랫폼 기반",
                  desc: "LMS·앱·시각 가이드를 갖춘 AIRO 플랫폼으로 출강 후에도 학습을 이어갑니다.",
                  icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18" stroke="white" strokeWidth="1.6" strokeLinecap="round"/><path d="M10 18C14.42 18 18 14.42 18 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 3"/><circle cx="10" cy="10" r="2" fill="white"/></svg>
                }
              ].map(({ title, desc, icon }) => <div className="wcard" key={title}><div className="wcard-icon">{icon}</div><div><h4>{title}</h4><p>{desc}</p></div></div>)}
            </div>
          </div>
        </section>

        <section className="trust sec">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">WHY TRUST US</div>
              <h2 className="sh2">정식 교육기관으로<br />성장하고 있습니다.</h2>
            </div>
            <div className="trust-grid">
              {[
                ["이러닝 인증 보유", "정식 이러닝 인증을 기반으로 온라인 콘텐츠 품질과 운영 체계를 갖춘 교육 파트너입니다.", "이러닝산업발전법 기반 인증"],
                ["온라인평생교육원 설립 준비 중", "평생교육사 보유를 기반으로 온라인평생교육원 설립을 추진하고 있습니다.", "평생교육법 기반 인가 진행 중"],
                ["검증된 현장 강사진", "공공·기업·교육 현장에서 실무를 쌓은 AI 전문 강사진이 대상과 목적에 맞춰 교육을 진행합니다.", "공공기관·기업 출강 다수 완료"]
              ].map(([title, desc, foot]) => <div className="tcard" key={title}><h3>{title}</h3><p>{desc}</p><div className="tcard-foot">{foot}</div></div>)}
            </div>
          </div>
        </section>

        <section className="courses sec" id="courses">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">EDUCATION TYPE</div>
              <h2 className="sh2">어떤 방식으로<br />배우실 건가요?</h2>
              <p className="sdesc">기관 출강부터 온라인 과정까지. 상황에 맞는 형태를 선택하세요.</p>
            </div>
            <CourseTabs />
          </div>
        </section>

        <section className="curriculum sec" id="curriculum">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">CURRICULUM · AIRO TRACKS</div>
              <h2 className="sh2">수준과 목적에 맞는<br />AI 교육 트랙</h2>
              <p className="sdesc">완전 기초부터 정규 교육과정까지. 역할·수준·목적에 따라 바로 적용 가능한 실습형 과정으로 설계합니다.</p>
            </div>
            <CurriculumTabs />
            <div className="airo-banner">
              <div>
                <h4>AIRO 기반 교육 운영</h4>
                <p>수준 진단, 실습 과제, 수료 관리까지 하나의 흐름으로 연결합니다. 교육 이후에도 복습과 심화 학습이 이어지도록 기관별 운영 흐름을 맞춥니다.</p>
                <div className="airo-feats"><span className="af">AIRO LMS</span><span className="af">실습 과제</span><span className="af">수료증 제공</span><span className="af">기관 맞춤 리포트</span></div>
              </div>
              <a href="#contact" className="btn bw btn-pill">교육 설계 문의</a>
            </div>
          </div>
        </section>

        <section className="clients sec" id="clients">
          <div className="wrap">
            <div className="sec-hd"><div className="ey">CLIENT CASES</div><h2 className="sh2">30+ 기관에서<br />검증된 AI 교육</h2><p className="sdesc">공공, 대학, 청년지원, 도시재생, 인재개발 현장에서 바로 쓰는 교육을 운영해 왔습니다.</p></div>
            <div className="client-logos">{["경기도경제과학진흥원", "평택대학교", "청년지원센터", "도시재생현장센터", "인재개발원", "지역교육센터"].map((name) => <div className="client-logo" key={name}><span>{name}</span></div>)}</div>
          </div>
        </section>

        <section className="reviews sec" id="reviews">
          <div className="wrap">
            <div className="sec-hd"><div className="ey">REVIEWS</div><h2 className="sh2">수강생이<br />직접 말합니다.</h2></div>
            <div className="review-grid">
              {[
                ["박", "박○○ 주무관", "공공교육기관", "교육이 끝나고 당일 보도자료 초안을 Claude로 작성했습니다. 기존보다 2배 이상 빠른 것 같아요. 이론 없이 전부 실습이라 집중이 달랐습니다."],
                ["이", "이○○ 교관", "전직지원 교육기관", "전직 준비 중인데 ChatGPT로 이력서와 자기소개서를 완성하는 법을 배웠습니다. 강사님이 우리 상황에 바로 적용해주셔서 현실적으로 도움됐어요."],
                ["김", "김○○ HRD 팀장", "인재개발원", "임직원 승진 교육에 AI 과정을 처음 넣었는데 만족도가 가장 높았습니다. 업무에 직접 쓸 수 있는 내용이라 구성원 반응이 완전히 달랐어요."]
              ].map(([initial, name, org, text]) => <div className="rcard" key={name}><div className="stars">★★★★★</div><p className="rtext">"{text}"</p><div className="rev"><div className="rav">{initial}</div><div><div className="rname">{name}</div><div className="rorg">{org}</div></div></div></div>)}
            </div>
          </div>
        </section>

        <section className="blog-sec sec" id="blog">
          <div className="wrap">
            <div className="sec-hd"><div className="ey">BLOG</div><h2 className="sh2">교육을 설계하고<br />현장을 기록하는 글</h2><p className="sdesc">출강 준비, 교육 운영, 출강 후 회고, 기술 문서까지. 우리가 어떻게 교육을 설계하고 검증하는지 기록합니다.</p></div>
            <div className="blog-grid">{posts.slice(0, 3).map((post) => <article className="blog-card" key={post.slug}><div>{post.thumbnailUrl ? <img className="card-thumb" src={post.thumbnailUrl} alt={post.title} loading="lazy" /> : null}<div className="blog-meta">{post.category}</div><h3>{post.title}</h3><p>{post.excerpt}</p></div><Link href={`/blog/${post.slug}`} className="blog-more">상세 보기 →</Link></article>)}</div>
          </div>
        </section>

        <section className="portfolio-sec sec" id="portfolio">
          <div className="wrap">
            <div className="sec-hd"><div className="ey">STUDENT PORTFOLIO</div><h2 className="sh2">수강생 작품<br />포트폴리오</h2><p className="sdesc">교육은 결과물로 남아야 합니다. 수강생은 과정 안에서 실제 업무와 연결되는 산출물을 완성합니다.</p></div>
            <div className="portfolio-grid">
              {portfolio.map((item) => {
                const embed = getVideoEmbed(item.videoUrl);
                return (
                  <Link href={`/portfolio/${item.id}`} className="work-card" key={item.id}>
                    {item.thumbnailUrl ? (
                      <img className="work-thumb-img" src={item.thumbnailUrl} alt={item.title} loading="lazy" />
                    ) : embed ? (
                      <div className="video-embed work-thumb-media"><iframe src={embed.embedUrl} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>
                    ) : (
                      <div className="work-thumb" />
                    )}
                    <div className="work-body"><div className="work-type">{item.type}</div><h3>{item.title}</h3></div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="field-sec sec" id="field-cases">
          <div className="wrap">
            <div className="sec-hd"><div className="ey">FIELD CASES</div><h2 className="sh2">출강사례</h2><p className="sdesc">기관의 목적과 참여자 수준에 맞춰 커리큘럼, 실습 난이도, 결과물을 조정합니다.</p></div>
            <div className="field-list">{cases.map((item, index) => <Link href={`/cases/${item.slug}`} className="field-item" key={item.slug}><div className="field-no">CASE {String(index + 1).padStart(2, "0")}</div><div className="field-main"><h3>{item.title}</h3><p>{item.summary}</p></div><div className="field-tags"><span>{item.clientType}</span><span>{item.hours}</span><span>실습형</span></div></Link>)}</div>
          </div>
        </section>

        <section className="faq-sec sec" id="faq">
          <div className="wrap faq-wrap">
            <div><div className="ey">FAQ</div><h2 className="sh2">자주 묻는 질문</h2><p className="sdesc">교육 문의 전에 많이 확인하는 내용을 먼저 정리했습니다.</p></div>
            <div className="faq-list">
              {[
                ["AI를 처음 접하는 사람도 들을 수 있나요?", "가능합니다. 완전 기초과정은 계정 만들기, 질문 방법, 기본 문서 작성부터 시작합니다."],
                ["기관 상황에 맞게 커리큘럼을 바꿀 수 있나요?", "가능합니다. 대상, 시간, 실습 산출물, 수료 방식에 맞춰 트랙을 조합해 설계합니다."],
                ["온라인 교육과 출강 교육 모두 가능한가요?", "둘 다 가능합니다. 실습 집중도가 필요한 과정은 출강 또는 혼합형 운영을 권장합니다."],
                ["수료증이나 결과 리포트를 받을 수 있나요?", "과정별 수료증 제공이 가능하며, 기관 교육은 운영 결과와 참여 현황을 정리해 드릴 수 있습니다."]
              ].map(([q, a]) => <div className="faq-item" key={q}><div className="faq-q">{q}</div><div className="faq-a">{a}</div></div>)}
            </div>
          </div>
        </section>

        <section className="cert sec" id="cert">
          <div className="wrap cert-grid">
            <div>
              <div className="ey">CERTIFICATION</div>
              <h2 className="sh2 sh2-lg">교육 이력과<br />AI 역량을<br />명확하게 남깁니다</h2>
              <p className="sdesc">자격 과정은 두 가지로 정리하고, 나머지 교육 트랙은 수료증 제공 형태로 운영합니다.</p>
              <div className="infra-block"><h4>교육기관 인프라</h4><p>이러닝 인증, 온라인평생교육원 설립 준비, 평생교육사 보유를 기반으로 안정적인 교육 운영 체계를 갖추고 있습니다.</p><div className="infra-bs"><span className="ib">이러닝 인증</span><span className="ib">온라인평생교육원 설립중</span><span className="ib">평생교육사 보유</span></div></div>
            </div>
            <div className="cert-cards">{["AI퍼실리테이터 전문가과정", "AI업무활용능력", "트랙별 수료증 제공", "교육 이력 관리"].map((title) => <div className="cc" key={title}><div className="cc-lv">CERTIFICATE</div><div className="cc-title">{title}</div><div className="cc-desc">교육 이력과 실무 역량을 명확하게 남길 수 있도록 지원합니다.</div></div>)}</div>
          </div>
        </section>

        <section className="process sec">
          <div className="wrap">
            <div className="sec-hd" style={{ textAlign: "center" }}><div className="ey">HOW IT WORKS</div><h2 className="sh2">교육 진행 과정</h2><p className="sdesc" style={{ margin: "0 auto" }}>문의부터 교육 완료까지, 모든 과정을 함께합니다.</p></div>
            <div className="proc-steps">{[
              ["01", "교육 문의", "목적·인원·일정을 알려주시면 24시간 내 회신합니다."],
              ["02", "트랙 선택·설계", "직무·기관에 맞는 트랙과 맞춤 커리큘럼을 제안드립니다."],
              ["03", "일정 확정", "출강·온라인 형태와 일정을 최종 협의합니다."],
              ["04", "교육 진행", "100% 실습 기반으로 현장 교육을 진행합니다."],
              ["05", "수료 & 사후 관리", "수료증 발급 · AIRO 플랫폼 연계 · 심화 과정 안내."]
            ].map(([no, title, desc], index) => <div className={`pstep ${index === 0 ? "act" : ""}`} key={no}><div className="ps-n">{no}</div><div className="ps-t">{title}</div><div className="ps-d">{desc}</div></div>)}</div>
          </div>
        </section>

        <section className="ticker-bar">
          <div className="ticker">
            {["경기도경제과학진흥원", "평택대학교", "청년지원센터", "도시재생현장센터", "인재개발원", "교육연수기관", "공공지원기관", "지역교육센터", "경기도경제과학진흥원", "평택대학교", "청년지원센터", "도시재생현장센터"].map((item, i) => <span className={i % 2 === 0 ? "hi" : ""} key={`${item}-${i}`}>{item}</span>)}
          </div>
        </section>

        <section className="cta-sec sec" id="contact">
          <div className="wrap">
            <div className="cta-in">
              <div>
                <h2>지금 바로<br />문의하세요.</h2>
                <p>교육 목적과 인원만 알려주시면<br />24시간 내 맞춤 제안서를 드립니다.<br />출강·온라인·커스텀 모두 가능합니다.</p>
              </div>
              <InquiryForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
