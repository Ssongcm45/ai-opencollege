// 광고 유입 정보(UTM·gclid) 수집. 클라이언트에서 첫 랜딩 URL을 읽어 localStorage에 저장하고,
// 문의 폼은 숨은 칸으로 함께 제출한다(lib/inquiry-service.ts의 attribution 필드).
// 광고 클릭(utm/gclid가 있는 방문)은 이전 기록을 덮어쓰고(마지막 광고 터치), 일반 방문은 기존 기록이 없을 때만 남긴다.

export const ATTRIBUTION_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "landing_page",
  "referrer"
] as const;

export type AttributionField = (typeof ATTRIBUTION_FIELDS)[number];
export type Attribution = Partial<Record<AttributionField, string>>;

const STORAGE_KEY = "oc_attribution";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"] as const;

function clip(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

function read(): (Attribution & { ts?: number }) | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution & { ts?: number };
    if (!parsed.ts || Date.now() - parsed.ts > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const fromUrl: Attribution = {};
    for (const key of CAMPAIGN_KEYS) {
      const value = url.searchParams.get(key)?.trim();
      if (value) fromUrl[key] = clip(value, key === "gclid" ? 255 : 150);
    }
    const hasCampaign = Object.keys(fromUrl).length > 0;
    if (!hasCampaign && read()) return;

    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin) ? clip(document.referrer, 500) : undefined;
    const record: Attribution & { ts: number } = {
      ...fromUrl,
      landing_page: clip(url.pathname + url.search, 500),
      ...(referrer ? { referrer } : {}),
      ts: Date.now()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // 저장소 차단(사생활 보호 모드 등) 시에는 수집하지 않는다.
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const stored = read();
  if (!stored) return {};
  const result: Attribution = {};
  for (const key of ATTRIBUTION_FIELDS) {
    if (stored[key]) result[key] = stored[key];
  }
  return result;
}
