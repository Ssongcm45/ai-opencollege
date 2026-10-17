// GA4 이벤트 전송 헬퍼(클라이언트 전용). gtag는 app/layout.tsx <head>에서 직접 설치한다.
// 이벤트 이름은 docs/261016 광고·리드 개선 보고서 표 6-11 기준:
// generate_lead(키 이벤트·입찰용), cta_click, phone_click, email_click, kakao_click,
// diagnosis_start, diagnosis_complete, sample_download.

export const BRAND = "opencollege";

export type CtaLocation = "hero" | "header" | "section" | "footer" | "lp" | "courses_index" | "course_detail";

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: EventParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", event, { brand: BRAND, ...params });
  } catch {
    // 측정 실패가 사용자 흐름을 막지 않도록 무시한다.
  }
}

// 폼 제출 성공 응답 직후에만 호출한다. lead_type은 브랜드 공통 분류(education · website · gateway).
export function trackLead(formId: string, ctaLocation: CtaLocation | string = "section") {
  track("generate_lead", { form_id: formId, lead_type: "education", cta_location: ctaLocation });
}
