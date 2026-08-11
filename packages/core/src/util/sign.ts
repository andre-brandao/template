const encoder = new TextEncoder();

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decode(text: string) {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (char) => char.charCodeAt(0));
}

function key(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

/**
 * HMAC-SHA256 over `value` bound to an expiry, base64url. WebCrypto rather than
 * `node:crypto` so it runs on Workers as well as Bun and Lambda.
 */
export async function sign(secret: string, value: string, expires: number) {
  const sig = await crypto.subtle.sign(
    "HMAC",
    await key(secret, "sign"),
    encoder.encode(`${value}.${expires}`),
  );
  return encode(new Uint8Array(sig));
}

/** False for a bad signature and for a good one that has expired. `expires` is unix seconds. */
export async function verify(secret: string, value: string, expires: number, sig: string) {
  if (!Number.isFinite(expires) || expires * 1000 < Date.now()) return false;
  return crypto.subtle
    .verify("HMAC", await key(secret, "verify"), decode(sig), encoder.encode(`${value}.${expires}`))
    .catch(() => false);
}
