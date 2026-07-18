import type { RequestEvent } from "@sveltejs/kit";

// Signed-cookie session holding just the resolved identity. The issuer's access
// token is verified once at /callback and discarded, so every later request is a
// cheap HMAC check with no token in the browser and no refresh dance.
// `dev` reads from NODE_ENV, not $app/environment, so the e2e `mint` helper can
// build a cookie outside SvelteKit.
const dev = process.env.NODE_ENV !== "production";

export interface Session {
  userID: string;
  email: string;
}

const COOKIE = "auth";
const OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !dev,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

const encoder = new TextEncoder();

function encode(bytes: Uint8Array) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decode(s: string) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function seal(session: Session) {
  const payload = encode(encoder.encode(JSON.stringify(session)));
  const sig = encode(
    new Uint8Array(await crypto.subtle.sign("HMAC", await key(), encoder.encode(payload))),
  );
  return `${payload}.${sig}`;
}

async function open(raw: string): Promise<Session | null> {
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const ok = await crypto.subtle.verify("HMAC", await key(), decode(sig), encoder.encode(payload));
  if (!ok) return null;
  try {
    return JSON.parse(new TextDecoder().decode(decode(payload))) as Session;
  } catch {
    return null;
  }
}

export async function read(event: RequestEvent): Promise<Session | null> {
  const raw = event.cookies.get(COOKIE);
  if (!raw) return null;
  const session = await open(raw).catch(() => null);
  if (!session) event.cookies.delete(COOKIE, { path: "/" });
  return session;
}

export async function write(event: RequestEvent, session: Session) {
  event.cookies.set(COOKIE, await seal(session), OPTS);
}

export function clear(event: RequestEvent) {
  event.cookies.delete(COOKIE, { path: "/" });
}
