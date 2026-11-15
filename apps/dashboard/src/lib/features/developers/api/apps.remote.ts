import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { env } from "$env/dynamic/private";
import { App } from "@template/core/app";
import { remote } from "$lib/server/remote";

export const getApps = remote
  .core(App.list)
  .with(z.void().transform(() => undefined))
  .query();

export const getApp = remote.core(App.fromID).query();

export const getAppKeys = remote.core(App.keys).query();

/** Where the App posts in. The API's public origin, which only the server knows. */
export const getEndpoint = remote.query(App.Info.shape.id, (id) =>
  new URL(`/hook/${id}`, env.API_URL ?? "http://localhost:3000").toString(),
);

/** The App's profile fields. A separate form from the user's own rename: different grant. */
export const renameApp = remote.form(
  z.object({ id: App.Info.shape.id, name: App.Info.shape.name }),
  (input) => App.update(input),
);

export const createApp = remote.form(App.Info.pick({ name: true }), async (input) => {
  const app = await App.create(input);
  await getApps().refresh();
  // An App is its account's profile: that page is where it is configured.
  redirect(303, `/u/${app.id}`);
});

export const removeApp = remote.form(z.object({ id: App.Info.shape.id }), async (input) => {
  await App.remove(input.id);
  await getApps().refresh();
  redirect(303, "/developers/apps");
});

/** Mints the inbound secret, retiring the last. Shown once, like a key; the row keeps it plain. */
export const rotateSecret = remote.form(z.object({ id: App.Info.shape.id }), async (input) => {
  const secret = await App.secret(input.id);
  await getApp(input.id).refresh();
  return { secret };
});
