import type { RequestEvent } from "@sveltejs/kit";
import { Session } from "@template/core/key/session";

// The cookie is an opaque token; the row behind it carries who, the role and the expiry.
// `dev` reads NODE_ENV, not $app/environment, so the e2e `mint` helper works outside SvelteKit.
const dev = process.env.NODE_ENV !== "production";

const COOKIE = "auth";
const OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !dev,
  path: "/",
  maxAge: Session.TTL,
};

export async function read(event: RequestEvent) {
  const raw = event.cookies.get(COOKIE);
  if (!raw) return null;
  const me = await Session.verify(raw);
  if (!me) {
    event.cookies.delete(COOKIE, { path: "/" });
    return null;
  }
  // The row's window slides on use, so re-set the cookie or the browser's copy expires first.
  event.cookies.set(COOKIE, raw, OPTS);
  return me;
}

export async function write(event: RequestEvent, user: string) {
  event.cookies.set(COOKIE, await Session.create(user), OPTS);
}

/** Drops the cookie and the row behind it, so a copy taken off the wire stops working too. */
export async function clear(event: RequestEvent) {
  const raw = event.cookies.get(COOKIE);
  event.cookies.delete(COOKIE, { path: "/" });
  if (raw) await Session.remove(raw);
}
