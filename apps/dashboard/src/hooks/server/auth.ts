import type { Handle } from "@sveltejs/kit";
import { Actor } from "@template/core/actor";
import * as session from "$lib/server/session";

export const auth: Handle = async ({ event, resolve }) => {
  // Health probes don't need an actor; skip it so they don't spam logs.
  if (event.url.pathname === "/healthz") return resolve(event);

  // One lookup answers all three: is the session live, who is it, what role do they hold.
  const me = await session.read(event);
  event.locals.session = me;
  if (!me) return Actor.provide("public", {}, () => resolve(event));

  return Actor.provide("user", { userID: me.userID, role: me.role, timezone: me.timezone }, () =>
    resolve(event),
  );
};
