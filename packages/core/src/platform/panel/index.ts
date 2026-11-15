import { z } from "zod";
import { ErrorCodes, VisibleError } from "../../error";
import { Identity } from "../../identity";
import { Storage } from "../../lib/storage";
import { User } from "../../user";
import { Assert } from "../../util/assert";
import { fn } from "../../util/fn";

/**
 * The panels the dashboard's agent builds, saved to open again: one JSON per panel in storage
 * under its author's prefix, so there is no table. Only the spec is kept, never rows; every
 * view reruns its SQL as whoever opens it.
 */
export namespace Panel {
  const assert = Assert.create("Panel");

  export const Spec = z
    .object({
      root: z.string().min(1).meta({ description: "Key of the root element." }),
      elements: z
        .record(
          z.string(),
          z.object({
            type: z.string(),
            props: z.record(z.string(), z.unknown()),
            children: z.array(z.string()).default([]),
          }),
        )
        .meta({ description: "Every element by key." }),
    })
    .meta({ description: "A json-render spec, opaque here: the browser's catalog validates it." });

  export const Info = z.object({
    id: z.uuid().meta({ description: "Panel id." }),
    title: z.string().meta({ description: "What it shows." }),
    spec: Spec,
    createdBy: z.string().meta({ description: "Id of the user who saved it." }),
    author: z.string().meta({ description: "Their name when they saved it." }),
    timeCreated: z.iso.datetime().meta({ description: "When it was first saved." }),
    timeUpdated: z.iso.datetime().meta({ description: "When it was last saved." }),
  });
  export type Info = z.infer<typeof Info>;

  const Input = z.object({
    title: z.string().trim().min(1).max(120).meta({ description: "What it shows." }),
    spec: Spec,
  });

  // A spec is a few KB; this only stops a runaway one from filling the disk.
  const SIZE = 200_000;

  export const create = fn(Input, async (input) => {
    Identity.check({ panel: ["create"] });
    fits(input.spec);
    const user = await User.fromID(Identity.userID());
    const now = new Date().toISOString();
    return write({
      id: crypto.randomUUID(),
      title: input.title,
      spec: input.spec,
      createdBy: Identity.userID(),
      author: user?.name ?? "",
      timeCreated: now,
      timeUpdated: now,
    });
  });

  /** The caller's panels without their spec, newest first. */
  export const list = fn(z.void(), async () => {
    Identity.check({ panel: ["read"] });
    const keys = await Storage.disk().files(prefix());
    const rows = await Promise.all(keys.map((one) => read(one)));
    return rows
      .filter((row) => row !== null)
      .map((row) => ({
        id: row.id,
        title: row.title,
        createdBy: row.createdBy,
        author: row.author,
        timeUpdated: row.timeUpdated,
      }))
      .sort((a, b) => b.timeUpdated.localeCompare(a.timeUpdated) || b.id.localeCompare(a.id));
  });

  export const fromID = fn(Info.shape.id, (id) => {
    Identity.check({ panel: ["read"] });
    return load(id);
  });

  /** Overwrites the content; who made it and when stay. */
  export const update = fn(Input.extend({ id: Info.shape.id }), async (input) => {
    Identity.check({ panel: ["update"] }, Identity.userID());
    fits(input.spec);
    const before = await load(input.id);
    return write({
      ...before,
      title: input.title,
      spec: input.spec,
      timeUpdated: new Date().toISOString(),
    });
  });

  export const remove = fn(Info.shape.id, async (id) => {
    Identity.check({ panel: ["delete"] }, Identity.userID());
    await load(id);
    await Storage.disk().delete(key(id));
  });

  // === UTILS ===

  // The prefix is the owner: a caller only ever reaches their own panels.
  function prefix() {
    return `panels/${Identity.userID()}/`;
  }

  // `id` is a uuid by its schema, so it can't walk out of the prefix.
  function key(id: string) {
    return `${prefix()}${id}.json`;
  }

  // Unchecked: every op checks its own grant first.
  function load(id: string) {
    return assert.exists(read(key(id)));
  }

  // A file that no longer parses reads as missing rather than failing the whole list.
  async function read(at: string) {
    const file = await Storage.disk().get(at);
    if (!file) return null;
    const parsed = Info.safeParse(JSON.parse(new TextDecoder().decode(file.bytes)));
    return parsed.success ? parsed.data : null;
  }

  async function write(info: Info) {
    await Storage.disk().put(
      key(info.id),
      new TextEncoder().encode(JSON.stringify(info)),
      "application/json",
    );
    return info;
  }

  function fits(spec: z.infer<typeof Spec>) {
    if (JSON.stringify(spec).length <= SIZE) return;
    throw new VisibleError(
      "validation",
      ErrorCodes.Validation.INVALID_PARAMETER,
      "Panel too large to save",
      "spec",
    );
  }
}
