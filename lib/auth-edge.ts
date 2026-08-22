// Edge-runtime session verification (Web Crypto only — no node:crypto/Buffer).
// Mirrors the HMAC-SHA256 signed cookie produced by lib/auth.ts, but performs a
// stateless structure+signature+exp check suitable for middleware. Versioned
// revocation still happens server-side in requireAdminSession().

export type EdgeSessionPayload = {
  sub: string;
  exp: number;
  ver?: number;
};

// base64url decode → UTF-8 string (atob-based; edge runtime provides atob).
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// bytes → base64url (matches node's digest("base64url") output).
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function verifySessionTokenEdge(
  token: string | undefined,
  secret: string
): Promise<{ valid: boolean; payload?: EdgeSessionPayload }> {
  if (!token || !secret) return { valid: false };

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra) return { valid: false };

  let expected: string;
  try {
    expected = await hmacSha256Base64Url(secret, encodedPayload);
  } catch {
    return { valid: false };
  }
  // Full-string equality of computed vs given signature.
  if (expected !== signature) return { valid: false };

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<EdgeSessionPayload>;
    if (payload.sub !== "admin" || typeof payload.exp !== "number") return { valid: false };
    if (payload.exp <= Math.floor(Date.now() / 1000)) return { valid: false };
    return { valid: true, payload: payload as EdgeSessionPayload };
  } catch {
    return { valid: false };
  }
}
