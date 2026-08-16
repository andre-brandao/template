import { z } from "zod";
import { Key } from "@template/core/key";
import { Actor } from "@template/core/actor";
import { remote } from "$lib/server/remote";

export const getKeys = remote
  .core(Key.list)
  .with(z.void().transform(() => ""))
  .query();

export const createKey = remote.form(
  z.object({ name: Key.Info.shape.name, ttl: z.enum(["", "30", "90", "365"]).optional() }),
  async (input) => {
    await Key.create({
      userID: Actor.userID(),
      name: input.name,
      expiresAt: Key.expires(input.ttl ? Number(input.ttl) : undefined),
    });
    await getKeys().refresh();
  },
);

export const removeKey = remote.form(z.object({ id: Key.Info.shape.id }), async (input) => {
  await Key.remove(input.id);
  await getKeys().refresh();
});
