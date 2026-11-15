import { redirect, type RequestEvent } from "@sveltejs/kit";

// Where sign-in lands. A cookie, so the code, password and OAuth round trips all find it.
// SvelteKit's cookie defaults already cover httpOnly, secure and sameSite.
const COOKIE = "next";

// Same-site paths only: `//host` and `/\host` read as another origin to the browser.
const safe = (path?: string | null) =>
  path?.startsWith("/") && !/^\/[/\\]/.test(path) ? path : undefined;

const here = (event: RequestEvent) => encodeURIComponent(event.url.pathname + event.url.search);

/** Sends a signed-out visitor to login, remembering the page they asked for. */
function login(event: RequestEvent): never {
  redirect(303, `/login?next=${here(event)}`);
}

/** Lets a named user through; anyone else logs in or finishes onboarding first. */
export function gate(event: RequestEvent, user: { name: string; email: string } | null) {
  if (!user) login(event);
  // `provision` names a fresh account after its address, so a match means no name yet.
  if (user.name === user.email) redirect(303, `/welcome?next=${here(event)}`);
}

/** Holds `path` for the next `take`; a visit without one clears any older value. */
export function keep(event: RequestEvent, path: string | null) {
  const value = safe(path);
  if (!value) return event.cookies.delete(COOKIE, { path: "/" });
  event.cookies.set(COOKIE, value, { path: "/", maxAge: 60 * 15 });
}

/** The held path, once, or home. */
export function take(event: RequestEvent) {
  const value = safe(event.cookies.get(COOKIE));
  if (value) event.cookies.delete(COOKIE, { path: "/" });
  return value ?? "/home";
}
