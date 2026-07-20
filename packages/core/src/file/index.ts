import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { and, arrayOverlaps, count, desc, eq, ilike } from "drizzle-orm";
import { fn } from "../util/fn";
import { found, VisibleError, ErrorCodes } from "../error";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Context } from "../context";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { Log } from "../util/log";
import { FileTable } from "./file.sql";
import type * as port from "./port";
import { createFsStorage } from "./adapter/fs";
import { createS3Storage } from "./adapter/s3";

export namespace File {
  const log = Log.create({ namespace: "core.file" });

  const MAX = 20 * 1024 * 1024;

  export type Object = port.Object;
  export type Port = port.Port;

  const ctx = Context.create<Port>();

  export function provide<R>(port: Port, fn: () => R): R {
    return ctx.provide(port, fn);
  }

  /** Curried form of `provide` for composition via `Context.withProviders`. */
  export function provider(port: Port) {
    return <R>(fn: () => R) => provide(port, fn);
  }

  /**
   * Same env fallback as `Database.use()`: routes that hit the raw Hono app
   * directly (bypassing `target.ts`'s per-request wrapper — chiefly tests)
   * still get a working backend instead of an error.
   */
  export function use(): Port {
    try {
      return ctx.use();
    } catch (err) {
      if (!(err instanceof Context.NotFound)) throw err;
      return fromEnv(process.env);
    }
  }

  /**
   * Builds a `Port` from env vars for the non-Worker targets (Bun dev/self-host,
   * Lambda). `STORAGE_DRIVER=fs|s3`, default `fs`. The Cloudflare Worker target
   * doesn't use this — it wires the native R2 binding directly via
   * `file/adapter/r2` since that's only available per-request as `env.Files`.
   */
  export function fromEnv(env: Record<string, string | undefined>): Port {
    const driver = env.STORAGE_DRIVER ?? "fs";

    if (driver === "s3") {
      log.info("using s3 storage");
      return createS3Storage({
        endpoint: required(env, "S3_ENDPOINT"),
        region: env.S3_REGION ?? "auto",
        bucket: required(env, "S3_BUCKET"),
        accessKeyId: required(env, "S3_ACCESS_KEY_ID"),
        secretAccessKey: required(env, "S3_SECRET_ACCESS_KEY"),
      });
    }
    log.info("using fs storage");

    const dir =
      env.STORAGE_DIR ??
      (env.NODE_ENV === "test" ? join(tmpdir(), "template-files-test") : "./.data/files");
    return createFsStorage({ dir });
  }

  function required(env: Record<string, string | undefined>, key: string): string {
    const value = env[key];
    if (!value) throw new Error(`Missing ${key} for STORAGE_DRIVER=s3`);
    return value;
  }

  const Tag = z.string().trim().min(1).max(64);

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.File.id }),
      userID: z.string(),
      filename: z.string(),
      contentType: z.string(),
      size: z.number(),
      tags: Tag.array().max(20),
      timeCreated: z.iso.datetime(),
    })
    .meta({
      ref: "File",
      description: "An uploaded file that belongs to a user.",
      example: Examples.File,
    });
  export type Info = z.infer<typeof Info>;

  function labels(tags?: string[]) {
    return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
  }

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

  export const upload = fn(
    z.object({
      file: z.instanceof(globalThis.File),
      tags: Tag.array().max(20).optional(),
    }),
    async (input) => {
      const { file } = input;
      if (file.size > MAX)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_PARAMETER,
          `File too large: max ${MAX} bytes`,
        );

      const id = Identifier.create("file");
      const userID = Actor.userID();
      const key = `${userID}/${id}`;
      const contentType = file.type || "application/octet-stream";
      const bytes = new Uint8Array(await file.arrayBuffer());

      await use().put(key, bytes, contentType);
      await Database.use((tx) =>
        tx.insert(FileTable).values({
          id,
          userID,
          filename: file.name,
          contentType,
          size: file.size,
          tags: labels(input.tags),
          key,
        }),
      );

      return found("File", await fromID.force(id));
    },
  );

  export const fromID = fn(Info.shape.id, (id) => row(id).then((r) => (r ? serialize(r) : null)));

  export const list = fn(
    Common.PaginatedInput.extend({
      tags: Tag.array().optional(),
      search: z.string().optional(),
    }),
    (input) => {
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = [eq(FileTable.userID, Actor.userID())];
      if (input.tags?.length) conditions.push(arrayOverlaps(FileTable.tags, input.tags));
      if (input.search) conditions.push(ilike(FileTable.filename, `%${input.search}%`));
      const where = and(...conditions);
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select()
            .from(FileTable)
            .where(where)
            .orderBy(desc(FileTable.timeCreated))
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(FileTable).where(where),
        ] as const);
        return { data: rows.map(serialize), page, pageSize, total: totalRows[0]?.total ?? 0 };
      });
    },
  );

  export const content = fn(Info.shape.id, async (id) => {
    const r = await row(id);
    if (!r) return null;
    const object = await use().get(r.key);
    if (!object) return null;
    return { bytes: object.bytes, contentType: object.contentType, filename: r.filename };
  });

  /** A presigned download URL for direct access, or null when the backend can't sign. */
  export const url = fn(
    z.object({ id: Info.shape.id, expires: z.number().min(1).optional() }),
    async (input) => {
      const r = await row(input.id);
      if (!r) return null;
      const port = use();
      if (!port.presign) return null;
      return port.presign({ key: r.key, method: "get", expires: input.expires });
    },
  );

  export const update = fn(
    z.object({
      id: Info.shape.id,
      filename: z.string().trim().min(1).max(255).optional(),
      tags: Tag.array().max(20).optional(),
    }),
    async ({ id, ...patch }) => {
      found("File", await fromID.force(id));
      await Database.use((tx) =>
        tx
          .update(FileTable)
          .set({
            ...(patch.filename !== undefined ? { filename: patch.filename } : {}),
            ...(patch.tags !== undefined ? { tags: labels(patch.tags) } : {}),
          })
          .where(and(eq(FileTable.id, id), eq(FileTable.userID, Actor.userID()))),
      );
      return found("File", await fromID.force(id));
    },
  );

  export const remove = fn(Info.shape.id, async (id) => {
    const r = found("File", await row(id));
    await use().del(r.key);
    await Database.use((tx) =>
      tx.delete(FileTable).where(and(eq(FileTable.id, id), eq(FileTable.userID, Actor.userID()))),
    );
  });

  function serialize(row: typeof FileTable.$inferSelect): Info {
    return {
      id: row.id,
      userID: row.userID,
      filename: row.filename,
      contentType: row.contentType,
      size: row.size,
      tags: row.tags,
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
