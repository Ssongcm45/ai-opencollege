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
    let id: string | undefined;
    let pathHash: string | undefined;

    if (isPlayer) {
      if (segments.length === 2 && segments[0] === "video") id = segments[1];
    } else if (segments.length === 1 || segments.length === 2) {
      if (/^\d+$/.test(segments[0] ?? "")) {
        id = segments[0];
        pathHash = segments[1];
      }
    } else if (segments.length === 3 && segments[0] === "channels") {
      id = segments[2];
    } else if (segments.length === 4 && segments[0] === "groups" && segments[2] === "videos") {
      id = segments[3];
    } else if (segments.length === 4 && ["showcase", "album"].includes(segments[0] ?? "") && segments[2] === "video") {
      id = segments[3];
    }

    const queryHashes = parsed.searchParams.getAll("h");
    if (queryHashes.length > 1) return null;
    const queryHash = queryHashes[0];
    if (pathHash && queryHash && pathHash.toLowerCase() !== queryHash.toLowerCase()) return null;
    const hash = pathHash ?? queryHash;

    if (!id || !/^\d{6,15}$/.test(id)) return null;
    if (hash !== undefined && !/^[a-f0-9]{6,16}$/i.test(hash)) return null;

    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ""}`
    };
  }

  return null;
}
