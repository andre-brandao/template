import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { env } from "$env/dynamic/private";
import { App } from "@template/core/app";
import { Event } from "@template/core/event";
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

/** What the App did: every event its bot caused, newest first. */
export const getActivity = remote.query(App.Info.shape.id, (id) =>
  Event.list({ userID: id, page: 1, pageSize: 25 }),
);

export const createApp = remote.form(App.Info.pick({ name: true }), async (input) => {
  const app = await App.create(input);
  await getApps().refresh();
  redirect(303, `/developers/apps/${app.id}`);
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
