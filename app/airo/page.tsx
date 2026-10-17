import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { siteUrl } from "@/lib/site";
import s from "./airo.module.css";

const pageTitle = "AIRO 시스템소개 · 오픈컬리지";
const pageDescription =
  "오픈컬리지 교육을 운영하는 학습 관리 플랫폼 AIRO. LMS·모바일 앱·실습 AI 환경·강사/운영 대시보드로 교육 전 진단부터 교육 후 복습까지 학습이 이어지는 방식을 소개합니다.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/airo" },
  openGraph: { title: pageTitle, description: pageDescription, url: "/airo" },
};

/* ───────── 데이터 ───────── */

const actors = [
  { key: "learner", role: "수강생", where: "LMS · 모바일 앱", items: ["영상 강의와 실습을 한 화면에서", "실습 제출 후 AI 피드백 확인", "앱 미션·스터디로 매일 복습"] },
  { key: "trainer", role: "강사", where: "강사 대시보드", items: ["강의실 개설·참가 승인", "실습 제출 검토와 코멘트", "참여가 끊긴 수강생 확인"] },
  { key: "manager", role: "운영 담당자", where: "관리자 대시보드", items: ["과정·강의 구성과 발행", "수강 신청·수강권 관리", "진도와 제출 현황 확인"] },
];

const modules = [
  { name: "AIRO LMS", desc: "PC 학습 공간. 영상 강의, 실습, 과제 제출, 진도, 자료실" },
  { name: "AIRO 앱", desc: "모바일 학습. 오늘의 미션, 스트릭·레벨, 스터디 모임" },
  { name: "실습 AI 환경 (Gadia)", desc: "강의 화면 안에서 바로 쓰는 실습 채팅. 별도 AI 계정 불필요" },
  { name: "강사·관리자 대시보드", desc: "제출 검토, 그룹·강의실 운영, 과정 빌더, 운영 지표" },
];

const flow = [
  { phase: "교육 전", title: "사전 진단", desc: "AI학습체크 30문항으로 현재 수준과 우선 학습 영역을 확인합니다.", where: "오픈컬리지 웹", href: "/check" },
  { phase: "교육 당일", title: "강의실 입장", desc: "PC에서 짧은 주소와 강의 코드로 접속하고, 강사 승인 후 회차 자료를 받습니다.", where: "LMS" },
  { phase: "교육 중", title: "영상 + 실습", desc: "강의 영상 옆 실습 채팅에서 바로 프롬프트를 실행해 봅니다.", where: "LMS · Gadia" },
  { phase: "교육 중", title: "제출 · 피드백", desc: "실습을 제출하면 AI 피드백이 즉시 도착하고, 강사가 검토 코멘트를 남깁니다.", where: "LMS · 강사 대시보드" },
  { phase: "교육 후", title: "미션 · 레벨", desc: "하루 5~15분 앱 미션으로 스트릭과 레벨을 쌓으며 학습 습관을 이어갑니다.", where: "AIRO 앱" },
  { phase: "교육 후", title: "복습 · 스터디", desc: "프롬프트 라이브러리, 자료실, Q&A, 스터디 모임으로 현업 적용을 이어갑니다.", where: "LMS · 앱" },
];

const scenarios = [
  {
    tag: "공공기관",
    title: "집합교육 후 사후학습",
    before: "하루 집합교육이 끝나면 학습이 끊기고, 현업 적용 여부를 알기 어렵습니다.",
    steps: ["교육 전 AI학습체크로 수준 파악", "당일 강의실 코드로 입장·실습", "교육 후 앱 미션으로 복습 유지", "제출 기록으로 적용 현황 확인"],
  },
  {
    tag: "기업",
    title: "직무교육 과제 관리",
    before: "과제를 메일·메신저로 받아 취합하느라 피드백이 늦어집니다.",
    steps: ["과정·강의를 코스 빌더로 구성", "실습 제출 즉시 AI 피드백", "강사가 대시보드에서 검토·코멘트", "참여가 끊긴 수강생 조기 확인"],
  },
  {
    tag: "대학",
    title: "비교과·정규과정 운영",
    before: "회차별 자료와 실습 환경을 매번 따로 안내해야 합니다.",
    steps: ["회차별 강의·자료를 LMS에 발행", "학생 개별 AI 계정 없이 실습", "스터디 그룹으로 팀 활동 운영", "진도·제출 현황으로 운영 점검"],
  },
  {
    tag: "개인",
    title: "자기주도 학습",
    before: "혼자 공부하면 무엇을 연습할지, 잘하고 있는지 알기 어렵습니다.",
    steps: ["진단 결과로 우선 영역 확인", "영상 보며 바로 옆에서 실습", "AI 피드백으로 프롬프트 개선", "스트릭·레벨로 꾸준함 유지"],
  },
];

const effects = [
  { title: "학습이 끊기지 않습니다", desc: "교육 당일 이후에도 앱 미션·스터디·자료실로 복습 동선이 이어집니다." },
  { title: "실습 준비가 간단합니다", desc: "수강생이 AI 서비스에 따로 가입하거나 키를 발급받지 않아도 강의 화면에서 실습합니다." },
  { title: "피드백이 빨라집니다", desc: "제출 즉시 AI 피드백을 받고, 강사는 검토가 필요한 제출에 집중합니다." },
  { title: "운영 현황이 보입니다", desc: "실제 시청 구간 기준 진도, 제출·검토 상태, 참여가 끊긴 수강생을 한 곳에서 확인합니다." },
];

const faqs: [string, string][] = [
  ["어떤 기기로 이용하나요?", "강의와 실습은 PC 브라우저의 AIRO LMS(learn.opencollege.co.kr)에서, 매일 복습 미션과 스터디는 모바일 앱에서 진행합니다. 실습 화면은 모바일에서도 세로로 정렬되어 볼 수 있습니다."],
  ["실습하려면 AI 서비스에 따로 가입해야 하나요?", "아닙니다. 강의 화면 옆 실습 채팅이 서버를 통해 실습 AI 환경(Gadia)에 연결되므로 수강생이 별도 로그인이나 API 키를 준비할 필요가 없습니다."],
  ["영상을 넘겨도 수강 완료가 되나요?", "실제로 재생한 구간만 시청으로 인정하며, 건너뛰거나 중복 재생한 구간은 진도에 더해지지 않습니다. 끊긴 지점부터 이어보기는 지원합니다."],
  ["AI 피드백만으로 평가하나요?", "AI 피드백은 실습 목표 달성도, 프롬프트 구조, 실무 적용성 등을 기준으로 즉시 제공되는 학습용 피드백입니다. 강사 검토와 코멘트는 별도로 진행됩니다."],
  ["기관 교육에도 맞춰 운영할 수 있나요?", "기관별 그룹과 강의실을 만들어 참가를 승인하고, 회차별 자료와 과제를 배포할 수 있습니다. 운영 방식은 교육 문의 시 기관 상황에 맞춰 함께 설계합니다."],
];

/* ───────── 목업 조각 ───────── */

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption className={s.caption}>
      <span className={s.capBadge}>예시 화면</span>
      {children}
    </figcaption>
  );
}

function BrowserBar({ url }: { url: string }) {
  return (
    <div className={s.bBar}>
      <span className={s.dots}><i /><i /><i /></span>
      <span className={s.url}>{url}</span>
    </div>
  );
}

function LmsPlayerMock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={s.browser}>
      <BrowserBar url="learn.opencollege.co.kr/courses" />
      <div className={s.lms}>
        {!compact && (
          <aside className={s.lmsSide}>
            <b>AIRO</b>
            <span className={s.sideOn}>내 과정</span>
            <span>진도</span>
            <span>프롬프트</span>
            <span>자료실</span>
            <span>Q&amp;A</span>
          </aside>
        )}
        <div className={s.lmsMain}>
          <div className={s.lmsHead}>
            <span className={s.chip}>M4 · 03</span>
            <strong>긴 메일 요약 프롬프트 만들기</strong>
          </div>
          <div className={s.player}>
            <div className={s.video}>
              <span className={s.play} />
              <div className={s.vBar}><span style={{ width: "62%" }} /></div>
            </div>
            <div className={s.chat}>
              <div className={s.chatHd}>실습 채팅</div>
              <div className={`${s.msg} ${s.me}`}>받은 메일을 3줄로 요약하고 회신 초안을 써줘</div>
              <div className={s.msg}>요약 ① 일정 변경 요청 ② 자료 회신 기한 ③ 담당자 지정…</div>
              <div className={s.composer}><span>프롬프트 입력</span><i /></div>
            </div>
          </div>
          <div className={s.lmsFoot}>
            <span>과정 진도</span>
            <div className={s.prog}><span style={{ width: "48%" }} /></div>
            <b>48%</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.phone}>
      <div className={s.notch} />
      <div className={s.screen}>{children}</div>
    </div>
  );
}

function AppHomeScreen() {
  return (
    <>
      <div className={s.appTop}>
        <span className={s.lv}>Lv.4</span>
        <span className={s.streak}>연속 12일</span>
      </div>
      <div className={s.appHello}>김OO님,<br />오늘도 5분만 해볼까요?</div>
      <div className={s.appCard}>
        <small>오늘의 미션</small>
        <b>회의록 요약 프롬프트 실습</b>
        <div className={s.prog}><span style={{ width: "66%" }} /></div>
      </div>
      <div className={s.appRow}>
        <div><small>이번 주</small><b>5 / 7일</b></div>
        <div><small>XP</small><b>1,240</b></div>
      </div>
      <div className={s.tabbar}><span className={s.tabOn}>홈</span><span>학습</span><span>미션</span><span>스터디</span></div>
    </>
  );
}

function AppMissionScreen() {
  const list = [
    ["퀴즈", "프롬프트 4요소 고르기", "1분", true],
    ["실습", "장문 메일 요약하기", "8분", true],
    ["성찰", "오늘 절감한 시간 적기", "3분", false],
    ["측정", "작업 전·후 시간 입력", "2분", false],
  ] as const;
  return (
    <>
      <div className={s.appTitle}>미션</div>
      <div className={s.mList}>
        {list.map(([type, title, min, done]) => (
          <div className={`${s.mItem} ${done ? s.mDone : ""}`} key={title}>
            <span className={s.mType}>{type}</span>
            <span className={s.mName}>{title}</span>
            <span className={s.mMin}>{done ? "완료" : min}</span>
          </div>
        ))}
      </div>
      <div className={s.tabbar}><span>홈</span><span>학습</span><span className={s.tabOn}>미션</span><span>스터디</span></div>
    </>
  );
}

function AppStudyScreen() {
  return (
    <>
      <div className={s.appTitle}>스터디</div>
      <div className={s.appCard}>
        <small>내 그룹</small>
        <b>업무자동화 스터디 B조</b>
        <div className={s.avatars}><i>김</i><i>이</i><i>박</i><i>+5</i></div>
      </div>
      <div className={s.appCard}>
        <small>다음 모임</small>
        <b>엑셀 자동화 사례 공유</b>
        <span className={s.meta}>목 19:30 · 온라인</span>
      </div>
      <div className={s.tabbar}><span>홈</span><span>학습</span><span>미션</span><span className={s.tabOn}>스터디</span></div>
    </>
  );
}

/* ───────── 페이지 ───────── */

export default function AiroPage() {
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: `${siteUrl}/airo`,
    about: {
      "@type": "SoftwareApplication",
      name: "AIRO",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web, Android, iOS",
      url: "https://learn.opencollege.co.kr",
      description: "AI 교육 수강생을 위한 학습 관리 플랫폼(LMS·모바일 앱·실습 AI 환경·강사/관리자 대시보드)",
      publisher: { "@type": "EducationalOrganization", name: "AI OpenCollege", url: siteUrl },
    },
  };

  return (
    <>
      <Header />
      <main className={s.page}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />

        {/* 1. HERO */}
        <section className={s.hero}>
          <div className={`wrap ${s.heroGrid}`}>
            <div className={s.heroText}>
              <div className="ey">AIRO SYSTEM</div>
              <h1 className="sh2 sh2-lg">교육이 끝나도<br />학습이 이어지는 AIRO</h1>
              <p className="sdesc">
                AIRO는 오픈컬리지 교육을 운영하는 학습 관리 플랫폼입니다. 강의 영상 옆에서 바로 실습하고, 제출하면 AI 피드백을 받고,
                교육이 끝난 뒤에는 앱 미션과 스터디로 현업 적용을 이어갑니다.
              </p>
              <div className={s.heroCta}>
                <Link href="/#contact" className="btn bp btn-pill" data-cta-location="airo">교육 문의하기</Link>
                <Link href="/check" className="btn bo btn-pill" data-cta-location="airo">AI학습체크 해보기</Link>
              </div>
              <ul className={s.heroPills}>
                <li>LMS</li><li>모바일 앱</li><li>실습 AI 환경</li><li>강사·관리자 대시보드</li>
              </ul>
            </div>
            <figure className={s.heroStage} aria-label="AIRO LMS 학습 화면과 모바일 앱 예시">
              <div className={s.heroDevices} aria-hidden="true">
                <LmsPlayerMock />
                <div className={s.heroPhone}>
                  <Phone><AppHomeScreen /></Phone>
                </div>
              </div>
              <Caption>LMS 학습 화면 + AIRO 앱 홈 (데이터는 가상)</Caption>
            </figure>
          </div>
        </section>

        {/* 2. 구조 */}
        <section className="sec">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">STRUCTURE</div>
              <h2 className="sh2">한눈에 보는 AIRO 구조</h2>
              <p className="sdesc">수강생·강사·운영 담당자가 각자의 화면에서 같은 학습 기록(진도·제출·피드백·활동)을 함께 봅니다.</p>
            </div>
            <div className={s.arch}>
              <div className={s.actors}>
                {actors.map((a) => (
                  <div className={`${s.actor} ${s[a.key]}`} key={a.key}>
                    <div className={s.actorHd}>
                      <span className={s.actorIcon} aria-hidden="true">{a.role.slice(0, 1)}</span>
                      <div><b>{a.role}</b><small>{a.where}</small></div>
                    </div>
                    <ul>{a.items.map((it) => <li key={it}>{it}</li>)}</ul>
                  </div>
                ))}
              </div>
              <div className={s.archLink} aria-hidden="true"><span /><span /><span /></div>
              <div className={s.core}>
                <div className={s.coreHd}><b>AIRO</b><span>학습 관리 플랫폼</span></div>
                <div className={s.modules}>
                  {modules.map((m) => (
                    <div className={s.module} key={m.name}><b>{m.name}</b><p>{m.desc}</p></div>
                  ))}
                </div>
                <div className={s.dataLayer}>
                  <span>공통 학습 기록</span>
                  <i>시청 구간 진도</i><i>실습 제출</i><i>AI·강사 피드백</i><i>미션·스트릭</i><i>스터디 활동</i>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 운영 흐름 */}
        <section className={`sec ${s.cream}`}>
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">HOW IT WORKS</div>
              <h2 className="sh2">교육 운영 흐름</h2>
              <p className="sdesc">교육 전 진단부터 교육 후 복습까지, 한 과정이 AIRO 안에서 이렇게 이어집니다.</p>
            </div>
            <ol className={s.flow}>
              {flow.map((f, i) => (
                <li className={s.step} key={f.title}>
                  <div className={s.stepNo}>{String(i + 1).padStart(2, "0")}</div>
                  <div className={s.stepBody}>
                    <span className={s.phase}>{f.phase}</span>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                    {f.href ? (
                      <Link href={f.href} className={s.where} data-cta-location="airo">{f.where} →</Link>
                    ) : (
                      <span className={s.where}>{f.where}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. 화면별 활용 */}
        <section className="sec">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">SCREENS</div>
              <h2 className="sh2">화면으로 보는 AIRO 활용</h2>
              <p className="sdesc">아래 화면은 이해를 돕기 위해 단순화한 예시이며, 이름과 수치는 가상 데이터입니다.</p>
            </div>

            {/* 4-1 LMS */}
            <div className={s.feature}>
              <div className={s.fText}>
                <span className={s.fNo}>01 · 수강생 · LMS</span>
                <h3>영상 옆에서 바로 실습합니다</h3>
                <p>넓은 화면에서는 강의 영상과 실습 채팅이 나란히, 모바일에서는 위아래로 배치됩니다. 실습 AI 환경(Gadia)이 강의 화면 안에 연결되어 있어 수강생은 별도 가입 없이 배운 내용을 바로 실행해 봅니다.</p>
                <ul className={s.checks}>
                  <li>실제로 재생한 구간만 진도로 인정, 끊긴 지점부터 이어보기</li>
                  <li>Enter로 전송하는 대화형 실습, 최근 대화 맥락 유지</li>
                  <li>강의·프롬프트 라이브러리·자료실·Q&amp;A를 한 곳에서</li>
                </ul>
              </div>
              <figure className={s.fMock} aria-label="LMS 강의 화면 예시">
                <div aria-hidden="true"><LmsPlayerMock /></div>
                <Caption>LMS 강의 + 실습 채팅</Caption>
              </figure>
            </div>

            {/* 4-2 Feedback */}
            <div className={`${s.feature} ${s.rev}`}>
              <div className={s.fText}>
                <span className={s.fNo}>02 · 수강생 · 실습 제출</span>
                <h3>제출하면 AI 피드백이 바로 옵니다</h3>
                <p>실습 프롬프트를 제출하면 실습 목표에 맞춘 기준으로 점수와 잘한 점, 개선할 점, 개선된 프롬프트 예시를 받습니다. 강사의 검토·코멘트는 별도로 이어집니다.</p>
                <div className={s.rubric}>
                  {[["실습 목표 달성도", 40], ["프롬프트 구조·명확성", 25], ["실무 적용 가능성", 20], ["개선 가능성", 15]].map(([k, v]) => (
                    <div className={s.rubRow} key={k}>
                      <span>{k}</span>
                      <div className={s.rubBar}><i style={{ width: `${(Number(v) / 40) * 100}%` }} /></div>
                      <b>{v}</b>
                    </div>
                  ))}
                  <small className={s.rubNote}>AI 피드백 평가 기준 배점(100점)</small>
                </div>
              </div>
              <figure className={s.fMock} aria-label="AI 피드백 화면 예시">
                <div className={s.browser} aria-hidden="true">
                  <BrowserBar url="learn.opencollege.co.kr/submissions" />
                  <div className={s.fb}>
                    <div className={s.fbHead}>
                      <div><small>실습 제출 · M4-03</small><b>긴 메일 요약 프롬프트</b></div>
                      <div className={s.score}><b>82</b><small>/100</small></div>
                    </div>
                    <div className={s.fbBox}>
                      <b className={s.good}>잘한 점</b>
                      <p>요약 분량과 출력 형식을 명확히 지정했습니다.</p>
                      <b className={s.improve}>개선할 점</b>
                      <p>회신 톤과 수신자 정보를 조건으로 추가해 보세요.</p>
                      <b>개선된 프롬프트 예시</b>
                      <code>아래 메일을 3줄로 요약하고, 거래처 담당자에게 정중한 톤으로…</code>
                    </div>
                    <div className={s.fbTrainer}><span>강사 코멘트</span>검토 대기</div>
                  </div>
                </div>
                <Caption>실습 제출 결과와 AI 피드백</Caption>
              </figure>
            </div>

            {/* 4-3 App */}
            <div className={s.feature}>
              <div className={s.fText}>
                <span className={s.fNo}>03 · 수강생 · 모바일 앱</span>
                <h3>하루 5~15분, 앱으로 이어가는 복습</h3>
                <p>교육이 없는 날에도 짧은 미션으로 학습 습관을 유지합니다. 퀴즈·실습·인증·성찰·측정 등 여러 유형의 미션이 있고, 결과물은 실제 업무에 쓰는 것을 목표로 합니다.</p>
                <ul className={s.checks}>
                  <li>연속 학습 스트릭과 레벨(새싹 → 거목)로 꾸준함 보상</li>
                  <li>스터디 그룹 가입, 모임 일정 확인과 신청</li>
                  <li>앱에서도 강의 이어보기와 퀴즈 진행</li>
                </ul>
              </div>
              <figure className={s.fMock} aria-label="AIRO 앱 홈, 미션, 스터디 화면 예시">
                <div className={s.phones} aria-hidden="true">
                  <Phone><AppHomeScreen /></Phone>
                  <Phone><AppMissionScreen /></Phone>
                  <Phone><AppStudyScreen /></Phone>
                </div>
                <Caption>앱 홈 · 미션 · 스터디</Caption>
              </figure>
            </div>

            {/* 4-4 Trainer */}
            <div className={`${s.feature} ${s.rev}`}>
              <div className={s.fText}>
                <span className={s.fNo}>04 · 강사 · 강사 대시보드</span>
                <h3>검토할 것과 챙길 사람이 먼저 보입니다</h3>
                <p>강사는 운영 그룹의 활성 멤버, 답변 대기 질문, 제출 검토 목록을 한 화면에서 확인합니다. 최근 접속이 끊기거나 스트릭이 멈춘 수강생은 따로 모아 보여줘 먼저 연락할 수 있습니다.</p>
                <ul className={s.checks}>
                  <li>강의실 개설, 강의 코드 발급, 참가 승인</li>
                  <li>실습 제출 검토·상태 설정·강사 코멘트</li>
                  <li>그룹·스터디 모임 운영과 Q&amp;A 답변</li>
                </ul>
              </div>
              <figure className={s.fMock} aria-label="강사 대시보드 예시">
                <div className={s.browser} aria-hidden="true">
                  <BrowserBar url="learn.opencollege.co.kr/trainer" />
                  <div className={s.dash}>
                    <div className={s.kpis}>
                      <div><small>운영 그룹</small><b>3</b></div>
                      <div><small>활성 멤버</small><b>42</b></div>
                      <div><small>답변 대기</small><b className={s.warn}>4</b></div>
                      <div><small>검토 대기</small><b className={s.warn}>7</b></div>
                    </div>
                    <div className={s.dashCols}>
                      <div className={s.panel}>
                        <div className={s.panelHd}>제출 검토</div>
                        {[["김OO", "회의록 요약", "검토 대기"], ["이OO", "엑셀 정리", "검토 대기"], ["박OO", "보고서 초안", "완료"]].map(([n, t, st]) => (
                          <div className={s.row} key={n}><span>{n}</span><span className={s.rowT}>{t}</span><em className={st === "완료" ? s.ok : s.pend}>{st}</em></div>
                        ))}
                      </div>
                      <div className={s.panel}>
                        <div className={s.panelHd}>챙겨야 할 수강생</div>
                        {[["최OO", "마지막 접속 6일 전"], ["정OO", "스트릭 중단"]].map(([n, t]) => (
                          <div className={s.row} key={n}><span>{n}</span><span className={s.rowT}>{t}</span><em className={s.alert}>연락</em></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <Caption>강사 대시보드 (가상 데이터)</Caption>
              </figure>
            </div>

            {/* 4-5 Admin */}
            <div className={s.feature}>
              <div className={s.fText}>
                <span className={s.fNo}>05 · 운영 담당자 · 관리자 대시보드</span>
                <h3>과정을 만들고, 운영 현황을 확인합니다</h3>
                <p>코스 빌더에서 과정 → 모듈 → 강의 순서로 커리큘럼을 구성하고, 영상·실습 과제·퀴즈·자료를 연결해 발행합니다. 관리자 화면에서는 수강 신청 상태와 과정 상태, 진도·제출 현황을 확인합니다.</p>
                <ul className={s.checks}>
                  <li>초안 → 발행 → 보관으로 과정 상태 관리</li>
                  <li>수강 신청 승인·반려와 수강권 관리</li>
                  <li>영상, 퀴즈, 프롬프트, 자료실 콘텐츠 관리</li>
                </ul>
              </div>
              <figure className={s.fMock} aria-label="코스 빌더와 관리자 대시보드 예시">
                <div className={s.browser} aria-hidden="true">
                  <BrowserBar url="learn.opencollege.co.kr/admin/builder" />
                  <div className={s.builder}>
                    <div className={s.tree}>
                      <div className={s.tCourse}>AI 업무자동화 과정 <em>발행</em></div>
                      <div className={s.tMod}>M1 · 프롬프트 기초</div>
                      <div className={s.tLes}>영상 · 프롬프트 4요소</div>
                      <div className={s.tLes}>실습 · 업무 요청 다시 쓰기</div>
                      <div className={s.tMod}>M2 · 문서·메일 자동화</div>
                      <div className={s.tLes}>영상 · 긴 메일 요약</div>
                      <div className={`${s.tLes} ${s.tNew}`}>+ 강의 추가</div>
                    </div>
                    <div className={s.stats}>
                      <div className={s.panelHd}>과정 상태</div>
                      <div className={s.stack}><i style={{ width: "20%" }} className={s.sDraft} /><i style={{ width: "65%" }} className={s.sPub} /><i style={{ width: "15%" }} className={s.sArc} /></div>
                      <div className={s.legend}><span><i className={s.sDraft} />초안</span><span><i className={s.sPub} />발행</span><span><i className={s.sArc} />보관</span></div>
                      <div className={s.panelHd}>수강 신청</div>
                      <div className={s.apply}><span>대기 <b>6</b></span><span>승인 <b>38</b></span><span>반려 <b>2</b></span></div>
                    </div>
                  </div>
                </div>
                <Caption>코스 빌더 + 운영 현황 (가상 데이터)</Caption>
              </figure>
            </div>
          </div>
        </section>

        {/* 5. 시나리오 */}
        <section className={`sec ${s.cream}`}>
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">USE CASES</div>
              <h2 className="sh2">이렇게 활용합니다</h2>
              <p className="sdesc">교육 대상과 운영 방식에 따라 AIRO의 쓰임이 달라집니다.</p>
            </div>
            <div className={s.scenarios}>
              {scenarios.map((sc) => (
                <article className={s.scenario} key={sc.title}>
                  <span className={s.scTag}>{sc.tag}</span>
                  <h3>{sc.title}</h3>
                  <div className={s.before}><b>기존</b><p>{sc.before}</p></div>
                  <div className={s.after}>
                    <b>AIRO와 함께</b>
                    <ol>{sc.steps.map((st) => <li key={st}>{st}</li>)}</ol>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 6. 기대효과 (정성) */}
        <section className="sec">
          <div className="wrap">
            <div className="sec-hd">
              <div className="ey">WHY AIRO</div>
              <h2 className="sh2">AIRO로 달라지는 점</h2>
            </div>
            <div className={s.effects}>
              {effects.map((e, i) => (
                <div className={s.effect} key={e.title}>
                  <span className={s.effNo}>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{e.title}</h3>
                  <p>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. FAQ */}
        <section className="faq-sec sec">
          <div className="wrap faq-wrap">
            <div>
              <div className="ey">FAQ</div>
              <h2 className="sh2">자주 묻는 질문</h2>
            </div>
            <div className="faq-list">
              {faqs.map(([q, a]) => (
                <div className="faq-item" key={q}><div className="faq-q">{q}</div><div className="faq-a">{a}</div></div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={s.cta}>
          <div className={`wrap ${s.ctaInner}`}>
            <div>
              <div className="ey">GET STARTED</div>
              <h2 className="sh2">우리 조직 교육에 AIRO를 붙여보세요</h2>
              <p className="sdesc">교육 목적과 대상에 맞춰 과정 구성과 AIRO 운영 방식을 함께 설계합니다.</p>
            </div>
            <div className={s.heroCta}>
              <Link href="/#contact" className="btn bp btn-pill btn-lg" data-cta-location="airo">교육 문의하기</Link>
              <Link href="/check" className="btn bw btn-pill btn-lg" data-cta-location="airo">AI학습체크</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
