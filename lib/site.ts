// 환경변수에 섞여 들어올 수 있는 공백/개행/후행 슬래시를 정규화한 사이트 기준 URL.
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://opencollege.co.kr")
  .trim()
  .replace(/\/+$/, "");

// 관리자 설정·썸네일이 없을 때 쓰는 기본 공유 이미지(1200x630). 카카오톡 등 미리보기에서 로고가 잘리지 않도록 가로형으로 구성.
export const defaultOgImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "AI OpenCollege · AI 실무교육 전문기관"
};
