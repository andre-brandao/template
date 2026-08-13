import { form, query } from "$app/server";
import { z } from "zod";
import { Admin } from "@template/core/admin";
import { Event } from "@template/core/event";
import { User } from "@template/core/user";
import { Webhook } from "@template/core/webhook";
import { auth, guard, remote } from "$lib/server/remote";

export const getUsers = remote(User.page).query();

// Unpinned from any `sourceID`, so core requires `admin: ["read"]` on the way through.
export const getEvents = remote(Event.list).query();

/** The filter options, kept apart from the list so typing a search doesn't refetch them. */
export const getFacets = remote(Event.facets)
  .with(z.void().transform(() => undefined))
  .query();

/** One round trip for the whole database screen: four independent reads, one await. */
export const getStats = query(async () => {
  auth();
  return guard(async () => {
    const [tables, queue, counts, server] = await Promise.all([
      Admin.tables(),
      Admin.queue(),
      Admin.counts(),
      Admin.server(),
    ]);
    return { tables, queue, counts, server };
  });
});

// The three mutations stay forms rather than commands so a refusal — demoting yourself,
// losing the grant mid-session — lands in `fields.allIssues()` instead of a bare rejection.
// Callers refresh the list themselves, since it is parameterised by search and page.
export const assignRole = form(
  z.object({ id: User.Info.shape.id, role: User.Info.shape.role }),
  async (input) => {
    auth();
    await guard(() => User.assign(input));
  },
);

export const disableUser = form(z.object({ id: User.Info.shape.id }), async (input) => {
  auth();
  await guard(() => User.remove(input.id));
});

export const enableUser = form(z.object({ id: User.Info.shape.id }), async (input) => {
  auth();
  await guard(() => User.restore(input.id));
});

export const getWebhooks = remote(Webhook.list)
  .with(z.void().transform(() => undefined))
  .query();

export const createWebhook = form(
  z.object({ url: Webhook.Info.shape.url, types: z.enum(Webhook.types).array().optional() }),
  async (input) => {
    auth();
    await guard(() => Webhook.create(input));
    await getWebhooks().refresh();
  },
);

// Enable and disable stay separate forms, like the user rows above — a hidden boolean
// would arrive as a string, and `Webhook.update` takes a real one.
export const enableWebhook = form(z.object({ id: Webhook.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Webhook.update({ id: input.id, enabled: true }));
  await getWebhooks().refresh();
});

export const disableWebhook = form(z.object({ id: Webhook.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Webhook.update({ id: input.id, enabled: false }));
  await getWebhooks().refresh();
});

export const removeWebhook = form(z.object({ id: Webhook.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Webhook.remove(input.id));
  await getWebhooks().refresh();
});
