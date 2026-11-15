import { z } from "zod";
import { API_URL } from "$app/env/private";
import { App } from "@template/core/app";
import { Key } from "@template/core/key";
import { remote } from "#lib/server/gate.ts";

// Admin configuration: no API route, so these are the only way in. Core holds the grants.
export const getApps = remote
  .core(App.list)
  .with(z.void().transform(() => undefined))
  .query();

export const getApp = remote.core(App.fromID).query();

export const getAppKeys = remote.core(App.keys).query();

/** Where the App posts in. The API's public origin is dashboard config only the server knows. */
export const getEndpoint = remote.query(App.Info.shape.id, (id) =>
  new URL(`/hook/${id}`, API_URL ?? "http://localhost:3000").toString(),
);

export const createApp = remote.core(App.create).command();

export const renameApp = remote.core(App.update).command();

export const removeApp = remote.core(App.remove).command();

export const revokeAppKey = remote.core(App.revoke).command();

/** Mints the inbound secret, retiring the last. Shown once, like a key. */
export const rotateSecret = remote.command(App.Info.shape.id, async (id) => ({
  secret: await App.secret(id),
}));

// Days, not a date: the form picks a span and the server turns it into an instant.
export const createAppKey = remote.command(
  z.object({
    app: App.Info.shape.id,
    name: Key.Info.shape.name,
    expiresInDays: z.number().int().positive().optional(),
  }),
  (input) =>
    App.key({ app: input.app, name: input.name, expiresAt: Key.expires(input.expiresInDays) }),
);
