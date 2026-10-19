import { randomBytes } from "node:crypto";
import { and, desc, eq, isNotNull, like, or } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import { audit } from "@/lib/audit";
import type { AgentIdentity } from "@/lib/agent-auth";
import { AgentError } from "@/lib/agent-http";
import { canonicalHint, normalizeCanonicalUrl, normalizeKeywords } from "@/lib/blog-seo";
import { getCategories } from "@/lib/content";
import { getDb, hasDatabase } from "@/lib/db";
import { blogPosts, type BlogPost } from "@/lib/db/schema";
import {
  ImageDecodeError,
  ImageStoreUnavailableError,
  MAX_IMAGE_BYTES,
  detectImageType,
  isOwnStorageUrl,
  storeImage
} from "@/lib/image-store";
import { markdownToHtml } from "@/lib/markdown-lite";
import { CONTENT_SANITIZE_OPTIONS } from "@/lib/sanitize";
import { ImageFetchError, fetchRemoteImage } from "@/lib/safe-image-fetch";
import { siteUrl } from "@/lib/site";

/* ────────────────────────────────────────────────
   외부 AI 에이전트용 블로그 초안 서비스 (REST·MCP 공통).
   - 에이전트는 초안(published=false)만 만들고 고칠 수 있다. 발행·대표 글 지정·삭제는 관리자 화면에서만.
   - 에이전트가 만든 미발행 초안(created_by_agent 있음)만 조회·수정할 수 있다.
   - 본문은 마크다운(기본) 또는 HTML 로 받아, 관리자 편집기와 같은 HTML 로 바꾸고 같은 규칙으로 정리(sanitize)한다.
   - 이미지(썸네일·OG·본문)는 모두 우리 저장소(Vercel Blob, blog/)로 옮겨 저장한다.
──────────────────────────────────────────────── */

const MAX_CONTENT_IMAGES = 20;
const IMAGE_CONCURRENCY = 4;
const MAX_CONTENT_CHARS = 100_000;

export type ImageRecord = { source: string; url: string };

type DraftFields = {
  title?: string;
  excerpt?: string;
  content?: string;
  contentFormat?: "markdown" | "html";
  category?: string;
  slug?: string;
  thumbnail?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
};

const TOP_KEYS = ["title", "subtitle", "content", "contentFormat", "category", "slug", "thumbnail", "seo"];
const SEO_KEYS = ["title", "description", "keywords", "ogImage", "canonicalUrl", "noindex"];
// 기존 글 주소와 같은 형식 — 영문 소문자·숫자·하이픈 (RSS·사이트맵·llms.txt 에 주소를 그대로 넣기 때문)
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* ── 입력 검사 ── */

function bad(message: string): never {
  throw new AgentError(400, message);
}

type TextOptions = { max: number; required?: boolean; nullable?: boolean; trim?: boolean };

function textField(obj: Record<string, unknown>, key: string, label: string, opts: TextOptions) {
  const value = obj[key];
  if (value === undefined) {
    if (opts.required) bad(`${label} 은(는) 필수입니다.`);
    return undefined;
  }
  if (value === null) {
    if (opts.required || !opts.nullable) bad(`${label} 은(는) 비울 수 없습니다.`);
    return null;
  }
  if (typeof value !== "string") bad(`${label} 은(는) 문자열이어야 합니다.`);
  const text = opts.trim === false ? value : value.trim();
  if (!text.trim()) {
    if (opts.required || !opts.nullable) bad(`${label} 은(는) 비울 수 없습니다.`);
    return null;
  }
  if (text.length > opts.max) bad(`${label} 은(는) ${opts.max.toLocaleString()}자 이하여야 합니다 (현재 ${text.length.toLocaleString()}자).`);
  return text;
}

function imageField(obj: Record<string, unknown>, key: string, label: string) {
  const value = obj[key];
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") bad(`${label} 은(는) 이미지 URL 또는 data URI 문자열이어야 합니다.`);
  const text = value.trim();
  if (!text.startsWith("data:") && text.length > 2000) bad(`${label} URL 은 2,000자 이하여야 합니다.`);
  return text;
}

function canonicalField(obj: Record<string, unknown>) {
  const text = textField(obj, "canonicalUrl", "seo.canonicalUrl", { max: 500, nullable: true });
  if (!text) return text;
  const url = normalizeCanonicalUrl(text);
  if (!url) bad(`seo.canonicalUrl 은 ${canonicalHint()} 주소만 쓸 수 있습니다.`);
  return url;
}

function keywordsField(obj: Record<string, unknown>) {
  const value = obj.keywords;
  if (value === undefined) return undefined;
  if (value === null) return null;
  let list: string[];
  if (typeof value === "string") list = value.split(",");
  else if (Array.isArray(value) && value.every((v) => typeof v === "string")) list = value as string[];
  else bad("seo.keywords 는 쉼표로 구분한 문자열이나 문자열 배열이어야 합니다.");
  const joined = normalizeKeywords(list);
  if (joined && joined.length > 500) bad(`seo.keywords 는 합쳐서 500자 이하여야 합니다 (현재 ${joined.length}자).`);
  return joined;
}

function slugField(obj: Record<string, unknown>) {
  const text = textField(obj, "slug", "slug", { max: 120 });
  if (text === undefined || text === null) return undefined;
  const slug = text.toLowerCase();
  if (!SLUG_PATTERN.test(slug)) bad("slug 에는 영문 소문자·숫자·하이픈(-)만 쓸 수 있고, 하이픈으로 시작·끝나거나 연달아 쓸 수 없습니다.");
  return slug;
}

function formatField(obj: Record<string, unknown>) {
  const value = obj.contentFormat;
  if (value === undefined || value === null) return undefined;
  if (value !== "markdown" && value !== "html") bad('contentFormat 은 "markdown" 또는 "html" 이어야 합니다.');
  return value;
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) bad(`${label} 은(는) JSON 객체여야 합니다.`);
  return value as Record<string, unknown>;
}

export function parseDraftInput(raw: unknown, mode: "create" | "update"): DraftFields {
  const body = asObject(raw, "요청 본문");
  if ("published" in body || "featured" in body) {
    throw new AgentError(403, "발행·대표 글 설정은 관리자만 할 수 있습니다. 에이전트는 초안만 등록하며, 발행은 관리자가 검토 후 합니다.");
  }
  const unknown = Object.keys(body).filter((k) => !TOP_KEYS.includes(k));
  if (unknown.length) bad(`알 수 없는 필드: ${unknown.join(", ")}. 사용할 수 있는 필드: ${TOP_KEYS.join(", ")}`);

  const create = mode === "create";
  const fields: DraftFields = {
    title: textField(body, "title", "title", { max: 180, required: create }) ?? undefined,
    excerpt: textField(body, "subtitle", "subtitle", { max: 300 }) ?? undefined,
    content: textField(body, "content", "content", { max: MAX_CONTENT_CHARS, required: create, trim: false }) ?? undefined,
    contentFormat: formatField(body),
    category: textField(body, "category", "category", { max: 60, required: create }) ?? undefined,
    slug: slugField(body),
    thumbnail: imageField(body, "thumbnail", "thumbnail")
  };
  if (fields.contentFormat && fields.content === undefined) bad("contentFormat 은 content 와 함께 보내야 합니다.");

  if (body.seo !== undefined && body.seo !== null) {
    const seo = asObject(body.seo, "seo");
    const unknownSeo = Object.keys(seo).filter((k) => !SEO_KEYS.includes(k));
    if (unknownSeo.length) bad(`seo 안의 알 수 없는 필드: ${unknownSeo.join(", ")}. 사용할 수 있는 필드: ${SEO_KEYS.join(", ")}`);
    fields.seoTitle = textField(seo, "title", "seo.title", { max: 200, nullable: true });
    fields.seoDescription = textField(seo, "description", "seo.description", { max: 500, nullable: true });
    fields.seoKeywords = keywordsField(seo);
    fields.ogImage = imageField(seo, "ogImage", "seo.ogImage");
    fields.canonicalUrl = canonicalField(seo);
    if (seo.noindex !== undefined) {
      if (typeof seo.noindex !== "boolean") bad("seo.noindex 는 true/false 여야 합니다.");
      fields.noindex = seo.noindex;
    }
  }

  if (!create && Object.values(fields).every((v) => v === undefined)) {
    bad("고칠 필드를 하나 이상 보내 주세요.");
  }
  return fields;
}

/** 관리자가 관리하는 블로그 카테고리 중 하나여야 한다 (편집 화면 선택 목록과 같게) */
async function resolveCategory(value: string) {
  const list = await getCategories("blog");
  const found = list.find((c) => c === value) ?? list.find((c) => c.toLowerCase() === value.toLowerCase());
  if (!found) bad(`category 는 다음 중 하나여야 합니다: ${list.join(", ")}`);
  return found;
}

/* ── 이미지 옮겨 저장 ── */

function shortSource(source: string) {
  if (source.startsWith("data:")) {
    const head = source.slice(0, source.indexOf(",") + 1 || 30);
    const bytes = Math.floor(((source.length - head.length) * 3) / 4);
    return `${head}…(약 ${bytes < 1024 ? `${bytes}B` : `${Math.round(bytes / 1024)}KB`})`;
  }
  return source.length > 160 ? `${source.slice(0, 157)}...` : source;
}

async function rehostOne(source: string): Promise<string> {
  if (isOwnStorageUrl(source)) return source;

  let buffer: Buffer;
  let declaredType: string | null = null;
  if (source.startsWith("data:")) {
    const match = source.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) throw new ImageFetchError("data URI 는 data:image/(png|jpeg|webp|gif);base64,... 형식만 허용됩니다.");
    declaredType = match[1].toLowerCase().replace("image/jpg", "image/jpeg");
    const b64 = match[2].replace(/\s+/g, "");
    if (Math.floor((b64.length * 3) / 4) > MAX_IMAGE_BYTES + 3) throw new ImageFetchError("이미지 크기는 5MB 이하여야 합니다.");
    buffer = Buffer.from(b64, "base64");
    if (buffer.length > MAX_IMAGE_BYTES) throw new ImageFetchError("이미지 크기는 5MB 이하여야 합니다.");
  } else {
    let url: URL;
    try {
      url = new URL(source);
    } catch {
      throw new ImageFetchError("https:// 이미지 주소나 data:image/...;base64 URI 여야 합니다.");
    }
    if (url.protocol !== "https:") throw new ImageFetchError("https:// 주소만 허용됩니다.");
    ({ buffer } = await fetchRemoteImage(source, MAX_IMAGE_BYTES));
  }

  const type = detectImageType(buffer.subarray(0, 16));
  if (!type) throw new ImageFetchError("JPG, PNG, WebP, GIF 형식만 지원합니다 (파일 내용이 이미지가 아닙니다).");
  if (declaredType && declaredType !== type) throw new ImageFetchError(`선언한 형식(${declaredType})과 실제 파일 형식(${type})이 다릅니다.`);
  return storeImage(buffer, type, "blog");
}

type ImageTask = { source: string; label: string };

async function rehostAll(tasks: ImageTask[]): Promise<Map<string, string>> {
  const unique = new Map<string, string>();
  for (const t of tasks) if (!unique.has(t.source)) unique.set(t.source, t.label);
  const entries = [...unique.entries()];
  const result = new Map<string, string>();
  let next = 0;
  let failure: AgentError | null = null;

  async function worker() {
    while (!failure && next < entries.length) {
      const [source, label] = entries[next++];
      try {
        result.set(source, await rehostOne(source));
      } catch (err) {
        if (err instanceof ImageStoreUnavailableError) {
          failure ??= new AgentError(503, "이미지 저장소가 설정되지 않아 이미지를 저장할 수 없습니다. 관리자에게 알려 주세요.");
          continue;
        }
        const known = err instanceof ImageFetchError || err instanceof ImageDecodeError;
        const reason = known ? (err as Error).message : "저장 중 오류가 났습니다.";
        if (!known) console.error("[agent-blog] 이미지 저장 실패:", err instanceof Error ? err.name : "unknown");
        failure ??= new AgentError(400, `이미지 처리 실패 — ${label} (${shortSource(source)}): ${reason}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(IMAGE_CONCURRENCY, entries.length) }, worker));
  if (failure) throw failure;
  return result;
}

/** 본문 HTML 의 <img src> 를 모은다. 정리 규칙과 같은 파서로 읽어 실제로 남을 이미지만 정확히 찾는다 */
function contentImageSources(html: string) {
  const sources: string[] = [];
  sanitizeHtml(html, {
    ...CONTENT_SANITIZE_OPTIONS,
    transformTags: {
      img: (tagName, attribs) => {
        if (attribs.src?.trim()) sources.push(attribs.src.trim());
        return { tagName, attribs };
      }
    }
  });
  return sources;
}

/** 본문을 HTML 로 바꾸고, 이미지 주소를 우리 저장소 주소로 바꾼 뒤 정리(sanitize)한다 */
function finalizeContent(html: string, swap: (source: string) => string) {
  return sanitizeHtml(html, {
    ...CONTENT_SANITIZE_OPTIONS,
    transformTags: {
      img: (tagName, attribs) => {
        const src = attribs.src?.trim();
        return { tagName, attribs: src ? { ...attribs, src: swap(src) } : attribs };
      }
    },
    // 옮겨 저장하지 못한 이미지는 남기지 않는다
    exclusiveFilter: (frame) => frame.tag === "img" && !isOwnStorageUrl(frame.attribs.src ?? "")
  });
}

/** 썸네일·OG·본문 이미지를 우리 저장소로 옮기고 필드를 새 주소로 바꾼다 */
async function processContentAndImages(fields: DraftFields, records: ImageRecord[]) {
  let html: string | undefined;
  if (fields.content !== undefined) {
    html = fields.contentFormat === "html" ? fields.content : markdownToHtml(fields.content);
  }

  const tasks: ImageTask[] = [];
  if (fields.thumbnail) tasks.push({ source: fields.thumbnail, label: "thumbnail" });
  if (fields.ogImage) tasks.push({ source: fields.ogImage, label: "seo.ogImage" });
  const contentSources = html !== undefined ? contentImageSources(html) : [];
  if (contentSources.length > MAX_CONTENT_IMAGES) {
    bad(`본문 이미지는 최대 ${MAX_CONTENT_IMAGES}개까지 넣을 수 있습니다 (현재 ${contentSources.length}개).`);
  }
  contentSources.forEach((source, i) => tasks.push({ source, label: `본문 이미지 ${i + 1}번째` }));

  const map = tasks.length ? await rehostAll(tasks) : new Map<string, string>();
  const swap = (source: string) => map.get(source) ?? source;

  if (fields.thumbnail) fields.thumbnail = swap(fields.thumbnail);
  if (fields.ogImage) fields.ogImage = swap(fields.ogImage);
  if (html !== undefined) {
    fields.content = finalizeContent(html, swap);
    if (!textOf(fields.content) && !/<img\b/i.test(fields.content)) bad("content 에 표시할 내용이 없습니다.");
  }
  for (const [source, url] of map) {
    if (source !== url) records.push({ source: shortSource(source), url });
  }
}

/* ── slug·요약 ── */

function textOf(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// 요약을 보내지 않으면 본문 앞부분 140자로 만든다 (목록·검색 설명에 쓰이므로 비울 수 없음)
function excerptFromContent(html: string) {
  const text = textOf(html);
  return text.length > 140 ? `${text.slice(0, 139).trimEnd()}…` : text;
}

function todayCompact() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date())
    .replace(/-/g, "");
}

// 제목의 영문·숫자로 만든다. 한글 제목처럼 쓸 만한 글자가 3자 미만이면 post-YYYYMMDD-xxxx
function slugFromTitle(title: string) {
  const slug = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
  return slug.replace(/-/g, "").length >= 3 ? slug : `post-${todayCompact()}-${randomBytes(2).toString("hex")}`;
}

/** 전체 글(발행·초안 모두)에서 겹치지 않는 slug — 겹치면 -2, -3 … 을 붙인다 */
async function uniqueSlug(base: string, excludeId?: string) {
  const rows = await getDb()
    .select({ id: blogPosts.id, slug: blogPosts.slug })
    .from(blogPosts)
    .where(or(eq(blogPosts.slug, base), like(blogPosts.slug, `${base}-%`)));
  const taken = new Set(rows.filter((r) => r.id !== excludeId).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

// 검사와 저장 사이에 다른 요청이 같은 slug 를 가져간 경우 (blog_posts.slug UNIQUE)
function isSlugConflict(error: unknown) {
  for (let e: unknown = error, depth = 0; e && depth < 4; e = (e as { cause?: unknown }).cause, depth++) {
    const code = (e as { code?: unknown }).code;
    if (code === "23505") return true;
  }
  return false;
}

/* ── 결과 형식 ── */

function links(id: string) {
  return { previewUrl: `${siteUrl}/admin/preview/blog/${id}`, editUrl: `${siteUrl}/admin/blog/${id}` };
}

function draftResult(row: BlogPost, images: ImageRecord[]) {
  return { id: row.id, slug: row.slug, status: "draft" as const, title: row.title, ...links(row.id), images };
}

function draftDetail(row: BlogPost) {
  return {
    id: row.id,
    slug: row.slug,
    status: row.published ? "published" : "draft",
    title: row.title,
    subtitle: row.excerpt,
    category: row.category,
    thumbnail: row.thumbnailUrl,
    // 저장 형식은 HTML (관리자 편집기와 같음)
    contentFormat: "html" as const,
    content: row.content,
    seo: {
      title: row.seoTitle,
      description: row.seoDescription,
      keywords: row.seoKeywords,
      ogImage: row.ogImage,
      canonicalUrl: row.canonicalUrl,
      noindex: row.noindex
    },
    createdByAgent: row.createdByAgent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...links(row.id)
  };
}

const editableDraft = (id: string) => and(eq(blogPosts.id, id), eq(blogPosts.published, false), isNotNull(blogPosts.createdByAgent));

function ensureDb() {
  if (!hasDatabase) throw new AgentError(503, "데이터베이스가 연결되어 있지 않습니다.");
}

async function loadEditable(id: string) {
  ensureDb();
  const [row] = await getDb().select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!row) throw new AgentError(404, `id ${id} 글을 찾을 수 없습니다.`);
  if (row.published) throw new AgentError(403, "이미 발행된 글은 에이전트가 조회·수정할 수 없습니다. 관리자에게 요청해 주세요.");
  if (!row.createdByAgent) throw new AgentError(403, "관리자가 작성한 글은 에이전트가 조회·수정할 수 없습니다.");
  return row;
}

export function parseDraftId(value: unknown) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) bad("id 는 초안 등록 때 받은 UUID 문자열이어야 합니다.");
  return value.toLowerCase();
}

/* ── 공개 함수 ── */

export async function createBlogDraft(agent: AgentIdentity, input: unknown) {
  ensureDb();
  const fields = parseDraftInput(input, "create");
  const category = await resolveCategory(fields.category!);
  const images: ImageRecord[] = [];
  await processContentAndImages(fields, images);

  const base = fields.slug ?? slugFromTitle(fields.title!);
  let row: BlogPost | undefined;
  for (let attempt = 0; !row; attempt++) {
    const slug = await uniqueSlug(base);
    try {
      [row] = await getDb().insert(blogPosts).values({
        title: fields.title!,
        slug,
        category,
        excerpt: fields.excerpt ?? (excerptFromContent(fields.content!) || fields.title!),
        content: fields.content!,
        thumbnailUrl: fields.thumbnail ?? null,
        seoTitle: fields.seoTitle ?? null,
        seoDescription: fields.seoDescription ?? null,
        seoKeywords: fields.seoKeywords ?? null,
        ogImage: fields.ogImage ?? null,
        canonicalUrl: fields.canonicalUrl ?? null,
        noindex: fields.noindex ?? false,
        // 에이전트 글은 입력과 상관없이 항상 초안, 대표 글 아님
        published: false,
        featured: false,
        publishedAt: null,
        createdByAgent: agent.name,
        updatedAt: new Date()
      }).returning();
    } catch (error) {
      if (!isSlugConflict(error) || attempt >= 2) {
        if (isSlugConflict(error)) throw new AgentError(409, "slug 가 다른 글과 겹쳤습니다. 잠시 후 다시 시도해 주세요.");
        throw error;
      }
    }
  }

  await audit("agent.draft-create", `${agent.name}: ${row.title}`);
  return draftResult(row, images);
}

export async function updateBlogDraft(agent: AgentIdentity, id: string, input: unknown) {
  const before = await loadEditable(id);
  const fields = parseDraftInput(input, "update");
  const category = fields.category !== undefined ? await resolveCategory(fields.category) : undefined;
  const images: ImageRecord[] = [];
  await processContentAndImages(fields, images);

  const set: Partial<typeof blogPosts.$inferInsert> = { updatedAt: new Date() };
  if (fields.title !== undefined) set.title = fields.title;
  if (fields.excerpt !== undefined) set.excerpt = fields.excerpt;
  if (fields.content !== undefined) set.content = fields.content;
  if (category !== undefined) set.category = category;
  if (fields.thumbnail !== undefined) set.thumbnailUrl = fields.thumbnail;
  if (fields.seoTitle !== undefined) set.seoTitle = fields.seoTitle;
  if (fields.seoDescription !== undefined) set.seoDescription = fields.seoDescription;
  if (fields.seoKeywords !== undefined) set.seoKeywords = fields.seoKeywords;
  if (fields.ogImage !== undefined) set.ogImage = fields.ogImage;
  if (fields.canonicalUrl !== undefined) set.canonicalUrl = fields.canonicalUrl;
  if (fields.noindex !== undefined) set.noindex = fields.noindex;
  if (fields.slug !== undefined && fields.slug !== before.slug) set.slug = await uniqueSlug(fields.slug, id);

  // 검사와 저장 사이에 관리자가 발행했으면 고치지 않는다
  let row: BlogPost | undefined;
  try {
    [row] = await getDb().update(blogPosts).set(set).where(editableDraft(id)).returning();
  } catch (error) {
    if (isSlugConflict(error)) throw new AgentError(409, "slug 가 다른 글과 겹쳤습니다. 다른 slug 로 다시 시도해 주세요.");
    throw error;
  }
  if (!row) throw new AgentError(409, "그 사이 관리자가 이 글을 발행해 더 이상 수정할 수 없습니다.");

  await audit("agent.draft-update", `${agent.name}: ${row.title}`);
  return draftResult(row, images);
}

export async function getBlogDraft(_agent: AgentIdentity, id: string) {
  return draftDetail(await loadEditable(id));
}

export async function listBlogDrafts(_agent: AgentIdentity) {
  ensureDb();
  const rows = await getDb()
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      category: blogPosts.category,
      createdByAgent: blogPosts.createdByAgent,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.published, false), isNotNull(blogPosts.createdByAgent)))
    .orderBy(desc(blogPosts.createdAt))
    .limit(100);
  return {
    drafts: rows.map((r) => ({
      ...r,
      status: "draft" as const,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      ...links(r.id)
    }))
  };
}

export async function listBlogCategories() {
  return { categories: await getCategories("blog") };
}

/** 이미지 하나만 먼저 올려 주소를 받는다 (본문에 넣기 전에 올리고 싶은 에이전트용) */
export async function uploadBlogImage(_agent: AgentIdentity, input: unknown) {
  const body = asObject(input, "요청 본문");
  const unknown = Object.keys(body).filter((k) => k !== "image" && k !== "alt");
  if (unknown.length) bad(`알 수 없는 필드: ${unknown.join(", ")}. 사용할 수 있는 필드: image, alt`);
  const image = imageField(body, "image", "image");
  if (!image) bad("image 는 필수입니다 (https 이미지 주소 또는 data:image/...;base64 URI).");
  const alt = textField(body, "alt", "alt", { max: 200, nullable: true }) ?? "";
  const map = await rehostAll([{ source: image, label: "image" }]);
  const url = map.get(image)!;
  return { url, source: shortSource(image), markdown: `![${alt.replace(/[[\]]/g, "")}](${url})` };
}
