import { z } from "zod";
import { Key } from "@template/core/key";
import { Actor } from "@template/core/actor";
import { remote } from "$lib/server/remote";

export const getKeys = remote
  .core(Key.list)
  .with(z.void().transform(() => ""))
  .query();

// Returns the secret: the row only keeps a hash, so this response is the one place it exists.
export const createKey = remote.form(
  z.object({ name: Key.Info.shape.name, ttl: z.enum(["", "30", "90", "365"]).optional() }),
  async (input) => {
    const key = await Key.create({
      userID: Actor.userID(),
      name: input.name,
      expiresAt: Key.expires(input.ttl ? Number(input.ttl) : undefined),
    });
    await getKeys().refresh();
    return { key: key.key };
  },
);

export const removeKey = remote.form(z.object({ id: Key.Info.shape.id }), async (input) => {
  await Key.remove(input.id);
  await getKeys().refresh();
});

/** A key for the API console: named for where it came from, and short-lived so it cleans up. */
export const mintKey = remote.command(z.void(), async () => {
  const key = await Key.create({
    userID: Actor.userID(),
    name: "api console",
    expiresAt: Key.expires(1),
  });
  await getKeys().refresh();
  return key.key;
});
