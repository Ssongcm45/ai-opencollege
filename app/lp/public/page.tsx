import type { Metadata } from "next";
import { LandingPage, type LandingContent } from "@/components/landing/LandingPage";
import { defaultOgImage, siteUrl } from "@/lib/site";

const path = "/lp/public";

const title = "공공기관 생성형 AI 교육 · 방문 출강 | AI OpenCollege";
const description =
  "행정 문서·보도자료·민원 응대·회의록 정리를 실습으로 배우는 공공기관 맞춤 생성형 AI 교육. 방문 출강, 2~8시간 맞춤 구성, 10~200명, 수료증 발급.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteUrl}${path}` },
  openGraph: { title, description, url: `${siteUrl}${path}`, type: "website", images: [defaultOgImage] }
};

const content: LandingContent = {
  lp: "public",
  eyebrow: "공공기관 · 지자체 AI 교육",
  title: "공공기관 업무에 바로 쓰는",
  titleAccent: "생성형 AI 교육",
  sub: "행정 문서, 보도자료, 민원 응대, 회의록 정리를 실제 업무 흐름에 맞춰 실습으로 배웁니다.",
  facts: ["방문 출강", "2~8시간 맞춤 구성", "10~200명", "수료증 발급", "24시간 내 회신"],
  topicsHeading: "교육에서 다루는 공공 업무",
  topicsDesc: "행정·공공 업무 흐름에 맞춘 커리큘럼으로, 교육이 끝난 뒤 바로 쓸 수 있는 결과물을 직접 만들어 봅니다.",
  topics: [
    { title: "행정 문서 작성", desc: "안내문, 공문 초안, 보고서 등 반복 문서를 AI로 빠르게 정리하고 검토하는 방법을 익힙니다." },
    { title: "보도자료 초안", desc: "핵심 메시지와 형식을 정해 보도자료 초안을 만들고, 사실관계를 점검하는 흐름을 실습합니다." },
    { title: "민원 응대 문안", desc: "상황별 안내·답변 문안을 정중하고 일관된 표현으로 다듬는 방법을 다룹니다." },
    { title: "회의록 정리·요약", desc: "회의 내용을 요약하고 결정 사항과 후속 조치를 정리하는 방법을 실습합니다." },
    { title: "공공데이터 분석", desc: "표·통계 자료를 AI로 정리하고 해석해 보고에 활용하는 기초를 익힙니다." },
    { title: "AI 리터러시·보안 유의사항", desc: "생성형 AI의 한계와 개인정보·보안 측면에서 조심해야 할 기준을 함께 정리합니다." }
  ],
  plansDesc: "기관의 대상과 시간에 맞춰 조합합니다. 신규 직원·실무자·관리자 등 계층별로 나누어 구성할 수 있습니다.",
  plans: [
    {
      label: "입문",
      hours: "2시간",
      title: "생성형 AI 첫 경험",
      items: ["ChatGPT·Claude·Gemini 기초 사용법", "업무 요청을 위한 프롬프트 기본 구조", "안전한 사용 기준과 유의사항"]
    },
    {
      label: "실무",
      hours: "4시간",
      title: "행정 업무에 바로 적용",
      items: ["보고서·보도자료·안내문 초안 작성", "회의록 요약과 민원 응대 문안", "통계·표 자료 정리, HWP 서식 활용"]
    },
    {
      label: "심화",
      hours: "8시간",
      title: "부서 업무 맞춤 실습",
      items: ["부서별 반복 업무를 골라 직접 개선", "공공데이터 정리·분석 실습", "재사용 가능한 업무 템플릿 정리"]
    }
  ],
  plansNote: "※ 위 구성은 예시이며, 대상·시간·실습 산출물에 맞춰 커리큘럼을 맞춤 설계합니다.",
  steps: [
    ["교육 문의", "목적·인원·일정을 알려주시면 24시간 내 회신합니다."],
    ["대상·목표 확인", "교육 대상의 수준과 기관이 원하는 목표를 함께 확인합니다."],
    ["커리큘럼 제안", "기관 업무에 맞는 주제와 시간 구성을 제안드립니다."],
    ["출강", "기관을 방문해 실습 중심으로 교육을 진행합니다."],
    ["수료증·결과 정리", "수료증을 발급하고 운영 결과와 참여 현황을 정리해 드립니다."]
  ],
  checkDesc:
    "교육 전에 직원들의 AI 활용 수준을 파악해 보세요. 5개 영역 30문항, 약 10분이면 AI 업무 실행 역량과 우선 학습 영역을 확인할 수 있습니다.",
  faqs: [
    ["AI를 처음 접하는 직원도 들을 수 있나요?", "가능합니다. 기초 과정은 계정 만들기, 질문 방법, 기본 문서 작성부터 시작합니다."],
    ["신규 직원·실무자·관리자처럼 계층별로 나눌 수 있나요?", "가능합니다. 대상, 시간, 실습 산출물에 맞춰 계층별로 커리큘럼을 나누어 설계합니다."],
    ["수료증을 받을 수 있나요?", "과정별 수료증 제공이 가능하며, 기관 교육은 운영 결과와 참여 현황을 정리해 드릴 수 있습니다."],
    ["온라인으로도 진행할 수 있나요?", "둘 다 가능합니다. 실습 집중도가 필요한 과정은 출강 또는 혼합형 운영을 권장합니다."],
    ["보안·개인정보 유의사항도 다루나요?", "네. AI 리터러시와 함께 생성형 AI 사용 시 개인정보·보안 측면에서 조심해야 할 기준을 교육에 포함합니다."]
  ],
  formDesc: "기관명, 교육 인원, 희망 시기만 알려주시면 담당자가 24시간 내 회신드립니다."
};

export default function PublicLandingPage() {
  return <LandingPage content={content} />;
}
