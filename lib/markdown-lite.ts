/* ────────────────────────────────────────────────
   서버용 간단한 마크다운 → HTML 변환 (외부 AI 에이전트 초안 등록용).
   블로그 본문은 TUI 에디터가 만든 HTML 로 저장하므로, 에이전트가 보낸 마크다운을 같은 형식으로 바꾼다.
   지원: 제목(# → h2), 문단, 줄바꿈(끝 공백 2칸), 굵게·기울임·취소선, 인라인 코드, 코드 블록(```),
         인용(>), 목록(-, *, +, 1.) 중첩, 구분선, 표(GFM), 링크, 이미지, <https://…> 자동 링크.
   원시 HTML 태그는 그대로 두고, 결과는 반드시 sanitize 를 거쳐 저장한다 (이 파일은 안전성을 보장하지 않는다).
──────────────────────────────────────────────── */

const BLOCK_HTML = /^<\/?(p|div|table|thead|tbody|tr|td|th|ul|ol|li|blockquote|pre|h[1-6]|hr|figure|img|br)\b/i;

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function cleanUrl(raw: string) {
  return raw.trim().replace(/^<|>$/g, "").trim();
}

/* ── 인라인 ── */

function renderInline(source: string): string {
  const stash: string[] = [];
  const keep = (html: string) => `\u0000${stash.push(html) - 1}\u0000`;
  let s = source;

  // 백슬래시 이스케이프
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!~|<>])/g, (_m, c: string) => keep(escapeText(c)));
  // 인라인 코드
  s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_m, _t, code: string) => keep(`<code>${escapeText(code.trim())}</code>`));
  // 이미지 (이미지·링크 모두 길이 상한: 닫는 괄호 없는 긴 입력의 역추적 방지)
  s = s.replace(
    /!\[([^\]\n]{0,500})\]\(\s*(<[^>\n]{1,2000}>|[^\s)]{1,2000})(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)/g,
    (_m, alt: string, src: string) => keep(`<img src="${escapeAttr(cleanUrl(src))}" alt="${escapeAttr(alt)}">`)
  );
  // 링크 — 글자 부분은 계속 인라인 처리한다
  s = s.replace(
    /\[([^\]\n]{1,500})\]\(\s*(<[^>\n]{1,2000}>|[^\s)]{1,2000})(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)/g,
    (_m, text: string, href: string) => `${keep(`<a href="${escapeAttr(cleanUrl(href))}">`)}${text}${keep("</a>")}`
  );
  // 자동 링크
  s = s.replace(/<(https?:\/\/[^\s<>]+)>/g, (_m, url: string) => keep(`<a href="${escapeAttr(url)}">${escapeText(url)}</a>`));
  // 원시 HTML 태그는 그대로 (나중에 sanitize)
  s = s.replace(/<\/?[a-zA-Z][^<>]*>/g, (tag) => keep(tag));
  // 나머지 글자 이스케이프
  s = s.replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // 강조 — 반복 길이를 묶어 닫는 기호가 없는 긴 입력에서도 느려지지 않게 한다
  s = s
    .replace(/\*\*(?=\S)([\s\S]{0,2000}?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w])__(?=\S)([\s\S]{0,2000}?\S)__(?![\w])/g, "$1<strong>$2</strong>")
    .replace(/~~(?=\S)([\s\S]{0,2000}?\S)~~/g, "<del>$1</del>")
    .replace(/\*(?=[^\s*])([^*]{0,2000}?[^\s*])\*/g, "<em>$1</em>")
    .replace(/\*(?=[^\s*])([^*])\*/g, "<em>$1</em>")
    .replace(/(^|[^\w])_(?=\S)([^_]*?\S)_(?![\w])/g, "$1<em>$2</em>");
  // 줄 끝 공백 2칸 → 줄바꿈
  s = s.replace(/ {2,}\n/g, "<br>\n");

  // 보관해 둔 조각 되돌리기 (조각 안에 조각이 있을 수 있어 몇 번 반복)
  for (let i = 0; i < 5 && s.includes("\u0000"); i++) {
    s = s.replace(/\u0000(\d+)\u0000/g, (_m, n: string) => stash[Number(n)] ?? "");
  }
  return s;
}

/* ── 블록 ── */

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/;
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}>\s?/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/;

function splitRow(line: string) {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  return row.split(/(?<!\\)\|/).map((cell) => cell.trim());
}

function isBlockStart(line: string, next?: string) {
  return FENCE.test(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line) || LIST_ITEM.test(line) ||
    (line.includes("|") && next !== undefined && TABLE_SEP.test(next) && next.includes("-"));
}

function renderBlocks(lines: string[]): string {
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // 코드 블록
    const fence = line.match(FENCE);
    if (fence) {
      const marker = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) body.push(lines[i++]);
      i++; // 닫는 줄
      const lang = fence[2] ? ` class="language-${escapeAttr(fence[2])}"` : "";
      out.push(`<pre><code${lang}>${escapeText(body.join("\n"))}</code></pre>`);
      continue;
    }

    // 제목 — 페이지 제목이 h1 이므로 본문은 h2 부터 쓴다
    const heading = line.match(HEADING);
    if (heading) {
      const level = Math.min(6, Math.max(2, heading[1].length));
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (HR.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // 인용
    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && lines[i].trim() && (QUOTE.test(lines[i]) || !isBlockStart(lines[i]))) {
        body.push(lines[i].replace(QUOTE, ""));
        i++;
      }
      out.push(`<blockquote>${renderBlocks(body)}</blockquote>`);
      continue;
    }

    // 목록
    const item = line.match(LIST_ITEM);
    if (item) {
      const baseIndent = item[1].length;
      const ordered = /\d/.test(item[2]);
      const start = ordered ? parseInt(item[2], 10) : 1;
      const items: string[][] = [];
      let tight = true;
      while (i < lines.length) {
        const current = lines[i];
        const m = current.match(LIST_ITEM);
        if (m && m[1].length === baseIndent && /\d/.test(m[2]) === ordered) {
          items.push([m[3]]);
          i++;
          continue;
        }
        if (!items.length) break;
        if (!current.trim()) {
          // 빈 줄 뒤에 같은 목록이 이어지거나 들여쓴 내용이 오면 계속
          const next = lines[i + 1];
          const nm = next?.match(LIST_ITEM);
          const sameList = Boolean(nm && nm[1].length === baseIndent && /\d/.test(nm[2]) === ordered);
          if (next !== undefined && next.trim() && (next.match(/^(\s*)/)![1].length > baseIndent || sameList)) {
            tight = false;
            items[items.length - 1].push("");
            i++;
            continue;
          }
          break;
        }
        const indent = current.match(/^(\s*)/)![1].length;
        if (indent > baseIndent) {
          items[items.length - 1].push(current.slice(Math.min(indent, baseIndent + 2 + (ordered ? 1 : 0))));
          i++;
          continue;
        }
        if (m || isBlockStart(current)) break;
        // 들여쓰지 않은 이어지는 줄 (lazy continuation)
        items[items.length - 1].push(current);
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
      const rendered = items.map((body) => {
        let html = renderBlocks(body);
        if (tight) html = html.replace(/^<p>([\s\S]*?)<\/p>/, "$1");
        return `<li>${html}</li>`;
      });
      out.push(`<${tag}${startAttr}>${rendered.join("")}</${tag}>`);
      continue;
    }

    // 표 (GFM)
    const next = lines[i + 1];
    if (line.includes("|") && next !== undefined && TABLE_SEP.test(next) && next.includes("-")) {
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) rows.push(splitRow(lines[i++]));
      const th = head.map((cell) => `<th>${renderInline(cell)}</th>`).join("");
      const tbody = rows.map((row) => `<tr>${head.map((_c, n) => `<td>${renderInline(row[n] ?? "")}</td>`).join("")}</tr>`).join("");
      out.push(`<table><thead><tr>${th}</tr></thead>${tbody ? `<tbody>${tbody}</tbody>` : ""}</table>`);
      continue;
    }

    // 문단
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && (para.length === 0 || !isBlockStart(lines[i], lines[i + 1]))) {
      para.push(lines[i]);
      i++;
    }
    const text = para.join("\n").trim();
    const html = renderInline(text);
    out.push(BLOCK_HTML.test(text) ? html : `<p>${html}</p>`);
  }

  return out.join("\n");
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  return renderBlocks(lines);
}
