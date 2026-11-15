import { Webhook } from "@template/core/webhook";
import { remote } from "$lib/server/remote";

// Admin configuration: no API route. `getWebhooks(owner)` narrows to one App's.
export const getWebhooks = remote.core(Webhook.list).query();

export const createWebhook = remote.core(Webhook.create).command();

export const updateWebhook = remote.core(Webhook.update).command();

export const removeWebhook = remote.core(Webhook.remove).command();
