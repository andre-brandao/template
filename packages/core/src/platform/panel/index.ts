import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Database } from "../../drizzle";
import { ErrorCodes, VisibleError } from "../../error";
import { Identifier } from "../../identifier";
import { Identity } from "../../identity";
import { UserTable } from "../../user/user.sql";
import { Assert } from "../../util/assert";
import { fn } from "../../util/fn";
import { PanelTable } from "./panel.sql";

/**
 * The panels the dashboard's agent builds, saved to open again. Only the spec is kept, never
 * rows; every view reruns its SQL as whoever opens it. Only its author changes one.
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
    id: z.string().meta({ description: "Panel id." }),
    title: z.string().meta({ description: "What it shows." }),
    spec: Spec,
    createdBy: z.string().meta({ description: "Id of the user who saved it." }),
    author: z.string().meta({ description: "Their name, empty when they are gone." }),
    timeCreated: z.iso.datetime().meta({ description: "When it was first saved." }),
    timeUpdated: z.iso.datetime().meta({ description: "When it was last saved." }),
  });
  export type Info = z.infer<typeof Info>;

  const Input = z.object({
    title: z.string().trim().min(1).max(120).meta({ description: "What it shows." }),
    spec: Spec,
  });

  // A spec is a few KB; this only stops a runaway one from filling the table.
  const SIZE = 200_000;

  export const create = fn(Input, async (input) => {
    Identity.check({ panel: ["create"] });
    fits(input.spec);
    const id = Identifier.create("panel");
    await Database.use((tx) =>
      tx.insert(PanelTable).values({
        id,
        createdBy: Identity.userID(),
        title: input.title,
        spec: input.spec,
      }),
    );
    return load(id);
  });

  /** Every saved panel without its spec, newest first. Shared by everyone who may read them. */
  export const list = fn(z.void(), () => {
    Identity.check({ panel: ["read"] });
    return Database.use((tx) =>
      tx
        .select({
          id: PanelTable.id,
          title: PanelTable.title,
          createdBy: PanelTable.createdBy,
          author: UserTable.name,
          timeUpdated: PanelTable.timeUpdated,
        })
        .from(PanelTable)
        .leftJoin(UserTable, eq(UserTable.id, PanelTable.createdBy))
        .where(isNull(PanelTable.timeDeleted))
        .orderBy(desc(PanelTable.timeUpdated), desc(PanelTable.id))
        .then((rows) =>
          rows.map((row) => ({
            ...row,
            author: row.author ?? "",
            timeUpdated: row.timeUpdated.toISOString(),
          })),
        ),
    );
  });

  export const fromID = fn(z.string().min(1), (id) => {
    Identity.check({ panel: ["read"] });
    return load(id);
  });

  /** Overwrites the content; who made it and when stay. */
  export const update = fn(Input.extend({ id: Info.shape.id }), async (input) => {
    const before = await load(input.id);
    Identity.check({ panel: ["update"] }, before.createdBy);
    fits(input.spec);
    await Database.use((tx) =>
      tx
        .update(PanelTable)
        .set({ title: input.title, spec: input.spec, timeUpdated: new Date() })
        .where(eq(PanelTable.id, input.id)),
    );
    return load(input.id);
  });

  export const remove = fn(Info.shape.id, async (id) => {
    const before = await load(id);
    Identity.check({ panel: ["delete"] }, before.createdBy);
    await Database.use((tx) =>
      tx.update(PanelTable).set({ timeDeleted: new Date() }).where(eq(PanelTable.id, id)),
    );
  });

  function serialize(row: typeof PanelTable.$inferSelect, author: string | null): Info {
    return {
      id: row.id,
      title: row.title,
      spec: row.spec,
      createdBy: row.createdBy,
      author: author ?? "",
      timeCreated: row.timeCreated.toISOString(),
      timeUpdated: row.timeUpdated.toISOString(),
    };
  }

  // === UTILS ===

  // Unchecked: a write checks its own grant against the row's author.
  async function load(id: string) {
    const row = await assert.exists(
      Database.use((tx) =>
        tx
          .select({ panel: PanelTable, author: UserTable.name })
          .from(PanelTable)
          .leftJoin(UserTable, eq(UserTable.id, PanelTable.createdBy))
          .where(and(eq(PanelTable.id, id), isNull(PanelTable.timeDeleted)))
          .then((rows) => rows.at(0)),
      ),
    );
    return serialize(row.panel, row.author);
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
