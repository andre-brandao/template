import { z } from "zod";
import { Actor } from "../actor";
import { Storage } from "../lib/storage";
import { fn } from "../util/fn";

/** Per file. Three of them stay well under a Worker's 100 MB request body. */
export const MAX = 10 * 1024 * 1024;
export const LIMIT = 3;
/** Every attachment key sits under its sender, so `read` can tell the author from the rest. */
export const PREFIX = "feedback/";

/**
 * Stores one image or PDF under the sender. The caller links the returned key through its own
 * read route and passes that URL to `create`, since core doesn't know the dashboard's origin.
 */
export const upload = fn(
  z
    .file()
    .max(MAX, `Each attachment can be at most ${MAX / 1024 / 1024} MB`)
    .refine(
      (file) => file.type.startsWith("image/") || file.type === "application/pdf",
      "Attach images or PDFs",
    ),
  async (file) => {
    Actor.check({ feedback: ["create"] });
    const ext = file.name.includes(".") ? file.name.split(".").pop() : file.type.split("/")[1];
    const key = `${PREFIX}${owner()}/${crypto.randomUUID()}.${ext?.replace(/\W/g, "") || "bin"}`;
    await Storage.disk().put(key, new Uint8Array(await file.arrayBuffer()), file.type);
    return { key, name: file.name || "attachment", type: file.type };
  },
);

/** An attachment's bytes: the sender reads their own, an admin any. Null outside `feedback/`. */
export const read = fn(z.string().min(1), (key) => {
  if (!key.startsWith(PREFIX) || key.includes("..")) return null;
  Actor.check({ feedback: ["read"] }, key.slice(PREFIX.length).split("/")[0]);
  return Storage.disk().get(key);
});

/** Whose folder the acting caller writes to; a system caller files without a person attached. */
export function owner() {
  const actor = Actor.use();
  return actor.type === "user" ? actor.properties.userID : "system";
}
