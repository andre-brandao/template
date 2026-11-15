import { z } from "zod";
import { Admin } from "@template/core/admin";
import { Event } from "@template/core/event";
import { User } from "@template/core/user";
import { remote } from "#lib/server/gate.ts";

export const getUsers = remote.core(Admin.users).query();

// Unpinned from any `sourceID`, so core requires `admin: ["read"]` on the way through.
export const getEvents = remote.core(Event.list).query();

/** The filter options, kept apart from the list so typing a search doesn't refetch them. */
export const getFacets = remote
  .core(Event.facets)
  .with(z.void().transform(() => undefined))
  .query();

/** One round trip for the whole database screen: four independent reads, one await. */
export const getStats = remote.query(z.void(), async () => {
  const [tables, queue, counts, server] = await Promise.all([
    Admin.tables(),
    Admin.queue(),
    Admin.counts(),
    Admin.server(),
  ]);
  return { tables, queue, counts, server };
});

// The three mutations stay forms rather than commands so a refusal — demoting yourself,
// losing the grant mid-session — lands in `fields.allIssues()` instead of a bare rejection.
// Callers refresh the list themselves, since it is parameterised by search and page.
export const assignRole = remote.form(
  z.object({ id: User.Info.shape.id, role: User.Info.shape.role }),
  (input) => User.assign(input),
);

export const disableUser = remote.form(z.object({ id: User.Info.shape.id }), (input) =>
  User.remove(input.id),
);

export const enableUser = remote.form(z.object({ id: User.Info.shape.id }), (input) =>
  User.restore(input.id),
);
