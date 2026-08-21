// TUI 에디터 도입 전 textarea/seed로 저장된 일반 텍스트 본문을 문단 HTML로 변환한다.
// 이미 HTML 태그가 있으면 그대로 반환한다.
const HAS_TAG_RE = /<[a-z][^>]*>/i;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c)
  );
}

export function toHtmlBody(value: string): string {
  if (HAS_TAG_RE.test(value)) return value;
  return escapeHtml(value)
    .split(/\r?\n\s*\r?\n/)
    .map((para) => `<p>${para.trim().replace(/\r?\n/g, "<br />")}</p>`)
    .join("");
}
