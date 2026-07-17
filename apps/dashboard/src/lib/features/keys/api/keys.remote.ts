import { form, query } from "$app/server";
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
  return Key.list("");
});

export const createKey = form(
  z.object({ name: Key.Info.shape.name, ttl: z.enum(["", "30", "90", "365"]).optional() }),
  async (input) => {
    auth();
    const days = input.ttl ? Number(input.ttl) : 0;
    await guard(() =>
      Key.create({
        userID: Actor.userID(),
        name: input.name,
        expiresAt: days ? new Date(Date.now() + days * 86_400_000) : null,
      }),
    );
    await getKeys().refresh();
  },
);

export const removeKey = form(z.object({ id: Key.Info.shape.id }), async (input) => {
  auth();
  await guard(() => Key.remove(input.id));
  await getKeys().refresh();
});
