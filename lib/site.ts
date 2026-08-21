// 환경변수에 섞여 들어올 수 있는 공백/개행/후행 슬래시를 정규화한 사이트 기준 URL.
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://opencollege.co.kr")
  .trim()
  .replace(/\/+$/, "");
