import { invalid } from "@sveltejs/kit";
import { z } from "zod";
import { Actor } from "@template/core/actor";
import { Storage } from "@template/core/storage";
import { remote } from "$lib/server/remote";
import { key } from "$lib/server/files";

/** Whatever is under the user's prefix, newest first — `Storage.Entry` straight through. */
export const getFiles = remote.query(z.void(), async () => {
  const rows = await Storage.disk().list(`${Actor.userID()}/`);
  return rows.sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));
});

export const renameFile = remote.form(
  z.object({ name: z.string(), to: z.string().trim().min(1).max(255) }),
  async (input) => {
    const from = key(input.name);
    if (!(await Storage.disk().exists(from))) invalid("That file no longer exists");
    await Storage.disk().move(from, key(input.to));
  },
);

export const removeFile = remote.form(z.object({ name: z.string() }), (input) =>
  Storage.disk().delete(key(input.name)),
);
