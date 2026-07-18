import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { fn } from "../util/fn";
import { found, VisibleError, ErrorCodes } from "../error";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Storage } from "../storage";
import { FileTable } from "./file.sql";

export namespace File {
  export const MimeType = z.enum(["image/png", "image/jpeg", "image/gif", "image/svg+xml"]);
  export type MimeType = z.infer<typeof MimeType>;

  const MAX_SIZE = 5 * 1024 * 1024;

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.File.id }),
      userID: z.string(),
      filename: z.string(),
      contentType: MimeType,
      size: z.number(),
      timeCreated: z.iso.datetime(),
    })
    .meta({
      ref: "File",
      description: "An uploaded file that belongs to a user.",
      example: Examples.File,
    });
  export type Info = z.infer<typeof Info>;

  /** Includes the internal storage key — never returned from a public accessor. */
  function row(id: string) {
    return Database.use((tx) =>
      tx
        .select()
        .from(FileTable)
        .where(and(eq(FileTable.id, id), eq(FileTable.userID, Actor.userID())))
        .then((rows) => rows[0] ?? null),
    );
  }

  export const upload = fn(z.object({ file: z.instanceof(globalThis.File) }), async (input) => {
    const { file } = input;
    const contentType = MimeType.safeParse(file.type);
    if (!contentType.success)
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_FORMAT,
        `Unsupported file type: ${file.type}`,
      );
    if (file.size > MAX_SIZE)
      throw new VisibleError(
        "validation",
        ErrorCodes.Validation.INVALID_PARAMETER,
        `File too large: max ${MAX_SIZE} bytes`,
      );

    const id = Identifier.create("file");
    const userID = Actor.userID();
    const key = `${userID}/${id}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    await Storage.use().put(key, bytes, contentType.data);
    await Database.use((tx) =>
      tx.insert(FileTable).values({
        id,
        userID,
        filename: file.name,
        contentType: contentType.data,
        size: file.size,
        key,
      }),
    );

    return found("File", await fromID.force(id));
  });

  export const fromID = fn(Info.shape.id, (id) => row(id).then((r) => (r ? serialize(r) : null)));

  export const content = fn(Info.shape.id, async (id) => {
    const r = await row(id);
    if (!r) return null;
    const object = await Storage.use().get(r.key);
    if (!object) return null;
    return { bytes: object.bytes, contentType: object.contentType, filename: r.filename };
  });

  export const remove = fn(Info.shape.id, async (id) => {
    const r = found("File", await row(id));
    await Storage.use().del(r.key);
    await Database.use((tx) =>
      tx.delete(FileTable).where(and(eq(FileTable.id, id), eq(FileTable.userID, Actor.userID()))),
    );
  });

  function serialize(row: typeof FileTable.$inferSelect): Info {
    return {
      id: row.id,
      userID: row.userID,
      filename: row.filename,
      contentType: row.contentType as MimeType,
      size: row.size,
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
