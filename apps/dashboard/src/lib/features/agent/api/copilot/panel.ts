import { z } from "zod";
import { Actor } from "@template/core/actor";
import { ErrorCodes, VisibleError } from "@template/core/error";
import { Storage } from "@template/core/storage";
import { User } from "@template/core/user";
import { fn } from "@template/core/util/fn";
import { Sql } from "./sql";

/**
 * The panels the agent builds, saved to open again: one JSON per panel in storage. Only the
 * spec is kept, never rows; every view reruns its SQL as whoever opens it.
 */
export namespace Panel {
  /** A json-render spec, opaque here: the browser's catalog validates its elements. */
  export const Spec = z.object({
    root: z.string().min(1),
    elements: z.record(
      z.string(),
      z.object({
        type: z.string(),
        props: z.record(z.string(), z.unknown()),
        children: z.array(z.string()).default([]),
      }),
    ),
  });

  export const Info = z.object({
    id: z.string(),
    title: z.string(),
    spec: Spec,
    thread: z.string().nullable(),
    createdBy: z.string(),
    author: z.string(),
    timeCreated: z.string(),
    timeUpdated: z.string(),
  });
  export type Info = z.infer<typeof Info>;

  /** Saves a new panel, or overwrites one the actor made. */
  export const save = fn(
    z.object({
      id: z.uuid().optional(),
      title: z.string().trim().min(1).max(120),
      spec: Spec,
      thread: z.string().max(255).nullable().default(null),
    }),
    async (input) => {
      Actor.check(Sql.Grant);
      if (JSON.stringify(input.spec).length > SIZE)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_PARAMETER,
          "Panel too large to save",
          "spec",
        );
      const before = input.id ? await load(input.id) : null;
      if (before) own(before);
      // An overwrite keeps who made it and when; only the content and the stamp move.
      const info: Info = {
        ...(before ?? (await origin(input.id))),
        title: input.title,
        spec: input.spec,
        thread: input.thread,
        timeUpdated: new Date().toISOString(),
      };
      await Storage.disk().put(
        key(info.id),
        new TextEncoder().encode(JSON.stringify(info)),
        "application/json",
      );
      return info;
    },
  );

  /** Every saved panel without its spec, newest first. Shared by everyone who may run SQL. */
  export const list = fn(z.void(), async () => {
    Actor.check(Sql.Grant);
    const keys = await Storage.disk().files(PREFIX);
    const rows = await Promise.all(keys.map((one) => load(one.slice(PREFIX.length, -5))));
    return rows
      .filter((row) => row !== null)
      .map((row) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        createdBy: row.createdBy,
        timeUpdated: row.timeUpdated,
      }))
      .sort((a, b) => b.timeUpdated.localeCompare(a.timeUpdated));
  });

  export const fromID = fn(z.uuid(), async (id) => {
    Actor.check(Sql.Grant);
    const info = await load(id);
    if (!info)
      throw new VisibleError(
        "not_found",
        ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
        "Panel not found",
      );
    return info;
  });

  /** Only its author removes a panel. */
  export const remove = fn(z.uuid(), async (id) => {
    Actor.check(Sql.Grant);
    const info = await load(id);
    if (!info) return;
    own(info);
    await Storage.disk().delete(key(id));
  });

  // === UTILS ===

  const PREFIX = "panels/";

  // A spec is a few KB; this only stops a runaway one from filling the disk.
  const SIZE = 200_000;

  function key(id: string) {
    return `${PREFIX}${id}.json`;
  }

  async function load(id: string) {
    const file = await Storage.disk().get(key(id));
    if (!file) return null;
    const parsed = Info.safeParse(JSON.parse(new TextDecoder().decode(file.bytes)));
    return parsed.success ? parsed.data : null;
  }

  // A new panel's identity: its id, its author and when it was made.
  async function origin(id: string = crypto.randomUUID()) {
    const user = await User.fromID(Actor.userID());
    return {
      id,
      createdBy: Actor.userID(),
      author: user?.name ?? "",
      timeCreated: new Date().toISOString(),
    };
  }

  function own(info: Info) {
    if (info.createdBy === Actor.userID()) return;
    throw new VisibleError(
      "forbidden",
      ErrorCodes.Permission.INSUFFICIENT_PERMISSIONS,
      "Only the panel's author can change it",
    );
  }
}
