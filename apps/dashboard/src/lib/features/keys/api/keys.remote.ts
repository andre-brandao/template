import { form, getRequestEvent, query } from "$app/server";
import { redirect } from "@sveltejs/kit";
import { z } from "zod";
import { Key } from "@template/core/key";
import { Actor } from "@template/core/actor";
import { guard } from "$lib/server/guard";

function auth() {
  if (Actor.use().type !== "user") redirect(303, "/login");
}

export const getKeys = query(async () => {
  auth();
  // The cookie token flags the caller's own session as `current`.
  return Key.list(getRequestEvent().locals.token);
});

export const createKey = form(Key.create.schema.pick({ name: true }), async (input) => {
  auth();
  await guard(() => Key.create({ userID: Actor.userID(), type: "api", name: input.name }));
  await getKeys().refresh();
});

export const removeKey = form(z.object({ id: Key.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Key.remove(input.id));
  await getKeys().refresh();
});
