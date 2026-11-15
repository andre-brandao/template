import { z } from "zod";
import { App } from "@template/core/app";
import { Key } from "@template/core/key";
import { Identity } from "@template/core/identity";
import { remote } from "$lib/server/remote";
import { getAppKeys } from "./apps.remote";

export const getKeys = remote
  .core(Key.list)
  .with(z.void().transform(() => ""))
  .query();

// One form for both owners: with `app` the key is the App's bot's, without it the caller's.
// Returns the secret: the row only keeps a hash, so this response is the one place it exists.
export const createKey = remote.form(
  z.object({
    name: Key.Info.shape.name,
    ttl: z.enum(["", "30", "90", "365"]).optional(),
    app: App.Info.shape.id.optional(),
  }),
  async (input) => {
    const expiresAt = Key.expires(input.ttl ? Number(input.ttl) : undefined);
    if (input.app) {
      const key = await App.key({ app: input.app, name: input.name, expiresAt });
      await getAppKeys(input.app).refresh();
      return { key: key.key };
    }
    const key = await Key.create({ userID: Identity.userID(), name: input.name, expiresAt });
    await getKeys().refresh();
    return { key: key.key };
  },
);

export const removeKey = remote.form(
  z.object({ id: Key.Info.shape.id, app: App.Info.shape.id.optional() }),
  async (input) => {
    if (input.app) {
      await App.revoke({ app: input.app, id: input.id });
      await getAppKeys(input.app).refresh();
      return;
    }
    await Key.remove(input.id);
    await getKeys().refresh();
  },
);

/** A key for the API console: named for where it came from, and short-lived so it cleans up. */
export const mintKey = remote.command(z.void(), async () => {
  const key = await Key.create({
    userID: Identity.userID(),
    name: "api console",
    expiresAt: Key.expires(1),
  });
  await getKeys().refresh();
  return key.key;
});
