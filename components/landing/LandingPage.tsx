import { Footer } from "@/components/Footer";
import { InstitutionMarquee } from "@/components/InstitutionMarquee";
import { LandingLeadForm } from "@/components/LandingLeadForm";
import { BUSINESS_INFO } from "@/lib/business-info";
import styles from "@/app/lp/lp.module.css";

export type LandingContent = {
  lp: "public" | "company";
  eyebrow: string;
  title: string;
  titleAccent: string;
  sub: string;
  facts: string[];
  topicsHeading: string;
  topicsDesc: string;
  topics: { title: string; desc: string }[];
  plansDesc: string;
  plans: { label: string; hours: string; title: string; items: string[] }[];
  plansNote: string;
  steps: [string, string][];
  checkDesc: string;
  faqs: [string, string][];
  formDesc: string;
};

const phoneHref = `tel:${BUSINESS_INFO.phone}`;

// 광고 랜딩 공통 레이아웃. 상단 바는 이탈을 줄이기 위해 로고·전화·문의만 둔다.
export function LandingPage({ content }: { content: LandingContent }) {
  const c = content;
  return (
    <>
      <header className={styles.bar}>
        <div className={`wrap ${styles.barIn}`}>
          <a href="/" className={styles.brand} aria-label="AI OpenCollege 홈">
            <img src="/logo.png" alt="" width={32} height={32} />
            <span>AI OpenCollege</span>
          </a>
          <div className={styles.barActs}>
            <a href={phoneHref} className={styles.barPhone}>
              <span className={styles.srOnly}>전화 문의 </span>{BUSINESS_INFO.phone}
            </a>
            <a href="#lp-form" className="btn bp btn-pill" data-cta="lp_header">교육 문의</a>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className="wrap">
            <div className="ey">{c.eyebrow}</div>
            <h1 className={styles.h1}>
              {c.title}
              <br />
              <span className={styles.ac}>{c.titleAccent}</span>
            </h1>
            <p className={styles.heroSub}>{c.sub}</p>
            <ul className={styles.facts} aria-label="교육 개요">
              {c.facts.map((fact) => <li key={fact}>{fact}</li>)}
            </ul>
            <div className={styles.heroActs}>
              <a href="#lp-form" className="btn bp btn-lg btn-pill" data-cta="lp_hero">무료 상담 신청</a>
              <a href={phoneHref} className="btn bow btn-lg btn-pill">전화 {BUSINESS_INFO.phone}</a>
            </div>
          </div>
        </section>

        <section className={styles.sec}>
          <div className="wrap">
            <div className={styles.secHd}>
              <div className="ey">TOPICS</div>
              <h2 className={styles.h2}>{c.topicsHeading}</h2>
              <p className={styles.desc}>{c.topicsDesc}</p>
            </div>
            <div className={styles.cards}>
              {c.topics.map((topic, index) => (
                <div className={styles.card} key={topic.title}>
                  <div className={styles.cardNo}>{String(index + 1).padStart(2, "0")}</div>
                  <h3>{topic.title}</h3>
                  <p>{topic.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.cream}`}>
          <div className="wrap">
            <div className={styles.secHd}>
              <div className="ey">PROGRAM</div>
              <h2 className={styles.h2}>교육 구성 예시</h2>
              <p className={styles.desc}>{c.plansDesc}</p>
            </div>
            <div className={styles.plans}>
              {c.plans.map((plan) => (
                <div className={styles.plan} key={plan.label}>
                  <div className={styles.planTop}>
                    <span className={styles.planLabel}>{plan.label}</span>
                    <span className={styles.planHours}>{plan.hours}</span>
                  </div>
                  <h3>{plan.title}</h3>
                  <ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
            <p className={styles.note}>{c.plansNote}</p>
            <p className={styles.gadia}>
              유료 AI 계정이 없어도 실습 가능한 환경(
              <a href="https://gadia.ai" target="_blank" rel="noopener noreferrer">Gadia</a>
              )을 안내해 드립니다. 실습 계정이 없는 기관·회사도 바로 실습할 수 있습니다.
            </p>
            <div className={styles.midCta}>
              <a href="#lp-form" className="btn bp btn-pill" data-cta="lp_program">우리 조직에 맞는 구성 제안받기</a>
            </div>
          </div>
        </section>

        <section className={styles.sec}>
          <div className="wrap">
            <div className={styles.secHd}>
              <div className="ey">PROCESS</div>
              <h2 className={styles.h2}>진행 과정</h2>
            </div>
            <ol className={styles.steps}>
              {c.steps.map(([title, desc], index) => (
                <li className={styles.step} key={title}>
                  <span className={styles.stepNo}>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.marqueeSec}`}>
          <div className="wrap">
            <div className={styles.secHd}>
              <div className="ey">INSTRUCTORS</div>
              <h2 className={styles.h2}>강사진 주요 출강 기관</h2>
            </div>
          </div>
          <InstitutionMarquee />
        </section>

        <section className={styles.sec}>
          <div className="wrap">
            <div className={styles.checkBox}>
              <div>
                <div className="ey">FREE CHECK</div>
                <h2 className={styles.h3}>AI 업무 실행 역량 진단 (무료)</h2>
                <p>{c.checkDesc}</p>
              </div>
              <a href="/check" className="btn bn btn-pill">진단 살펴보기 →</a>
            </div>
          </div>
        </section>

        <section className={`${styles.sec} ${styles.cream}`}>
          <div className="wrap">
            <div className={styles.secHd}>
              <div className="ey">FAQ</div>
              <h2 className={styles.h2}>자주 묻는 질문</h2>
            </div>
            <div className={styles.faq}>
              {c.faqs.map(([q, a]) => (
                <details className={styles.faqItem} key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.formSec} id="lp-form">
          <div className={`wrap ${styles.formWrap}`}>
            <div className={styles.formIntro}>
              <div className="ey">CONTACT</div>
              <h2 className={styles.h2}>교육 문의 (1분)</h2>
              <p>{c.formDesc}</p>
              <p className={styles.formPhone}>
                전화 문의 <a href={phoneHref}>{BUSINESS_INFO.phone}</a>
              </p>
            </div>
            <div className={styles.formCard}>
              <LandingLeadForm lp={c.lp} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
