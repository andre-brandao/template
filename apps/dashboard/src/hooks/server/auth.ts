import type { Handle } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import * as session from "$lib/server/session";

// Probes carry no cookie and get hit on an interval; resolving an actor for them would
// only spam the logs.
const probes = new Set(["/healthz", "/readyz", "/startupz"]);

export const auth: Handle = async ({ event, resolve }) => {
  if (probes.has(event.url.pathname)) return resolve(event);

  // One lookup answers all three: is the session live, who is it, what role do they hold.
  const me = await session.read(event);
  event.locals.session = me;
  if (!me) return Actor.provide("public", {}, () => resolve(event));

  return Actor.provide("user", { userID: me.userID, role: me.role, timezone: me.timezone }, () =>
    resolve(event),
  );
};
