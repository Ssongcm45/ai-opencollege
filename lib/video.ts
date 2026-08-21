export type VideoEmbed = { provider: "youtube" | "vimeo"; embedUrl: string };

export function getVideoEmbed(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase();
  const youtubeHosts = new Set([
    "www.youtube.com",
    "youtube.com",
    "m.youtube.com",
    "www.youtube-nocookie.com",
    "youtube-nocookie.com"
  ]);

  if (youtubeHosts.has(host) || host === "youtu.be") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    let id: string | null = null;

    if (host === "youtu.be") {
      id = segments[0] ?? null;
    } else if (segments[0] === "watch") {
      id = parsed.searchParams.get("v");
    } else if (["shorts", "embed", "live"].includes(segments[0] ?? "")) {
      id = segments[1] ?? null;
    }

    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` };
  }

  if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
    const segments = parsed.pathname.split("/").filter(Boolean);
    const isPlayer = host === "player.vimeo.com";
    const id = isPlayer && segments[0] === "video" ? segments[1] : !isPlayer ? segments[0] : null;
    const hash = isPlayer ? undefined : segments[1];

    if (!id || !/^\d{6,15}$/.test(id)) return null;
    if (hash && !/^[a-f0-9]{6,16}$/i.test(hash)) return null;

    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ""}`
    };
  }

  return null;
}
