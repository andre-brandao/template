// fallow-ignore-file duplicate-export -- session.ts exposes the same deliberate
// cookie read/write pair; parallel namespace-style APIs, not a duplicate to merge.
import type { RequestEvent } from "@sveltejs/kit";
import { Prefs } from "@template/core/user/prefs";

// The theme must be on `<html>` before first paint, so it rides its own cookie instead
// of a per-request database read. Unsigned — the worst a forged value does is flip the theme.
const COOKIE = "theme";
const OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  // Matches the session cookie: SvelteKit would otherwise force `Secure`, which some
  // browsers drop over plain http in dev and e2e.
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

const schema = Prefs.shape.theme.catch("system");

/** Always a valid theme — an absent or tampered cookie reads as `system`. */
export function read(event: RequestEvent) {
  return schema.parse(event.cookies.get(COOKIE));
}

export function write(event: RequestEvent, theme: Prefs["theme"]) {
  if (read(event) === theme) return;
  event.cookies.set(COOKIE, theme, OPTS);
}
