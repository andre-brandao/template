import { z } from "zod";
import { Webhook } from "@template/core/webhook";
import { remote } from "$lib/server/remote";

/** Every subscription, or one App's — its page passes its id. */
export const getWebhooks = remote.core(Webhook.list).query();

// `userID` files the subscription under an App; absent, it is the admin's own.
export const createWebhook = remote.form(
  z.object({
    url: Webhook.Info.shape.url,
    types: z.enum(Webhook.types).array().optional(),
    userID: z.string().optional(),
  }),
  async (input) => {
    await Webhook.create(input);
    await getWebhooks(undefined).refresh();
    if (input.userID) await getWebhooks(input.userID).refresh();
  },
);

// Enable and disable stay separate forms — a hidden boolean would arrive as a string, and
// `Webhook.update` takes a real one. Every list may hold the row, so all of them refresh.
export const enableWebhook = remote.form(z.object({ id: Webhook.Info.shape.id }), async (input) => {
  await Webhook.update({ id: input.id, enabled: true });
});

export const disableWebhook = remote.form(
  z.object({ id: Webhook.Info.shape.id }),
  async (input) => {
    await Webhook.update({ id: input.id, enabled: false });
  },
);

export const removeWebhook = remote.form(z.object({ id: Webhook.Info.shape.id }), async (input) => {
  await Webhook.remove(input.id);
});
