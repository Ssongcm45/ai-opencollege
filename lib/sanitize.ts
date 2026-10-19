import sanitizeHtml from "sanitize-html";

// CMS 본문(블로그·출강사례·포트폴리오) 허용 태그. 관리자 저장과 에이전트 초안 등록이 같은 규칙을 쓴다.
export const CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "del", "s", "u", "ul", "ol", "li", "blockquote", "a", "code", "pre", "span", "table", "thead", "tbody", "tr", "th", "td", "img"],
  allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"], "*": ["class"] },
  allowedSchemes: ["http", "https", "mailto"],
  disallowedTagsMode: "discard"
};

export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, CONTENT_SANITIZE_OPTIONS);
}
