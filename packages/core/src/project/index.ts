import { z } from "zod";
import { and, asc, count, eq, ilike, isNull } from "drizzle-orm";
import { fn } from "../util/fn";
import { found } from "../error";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { order } from "../drizzle/order";
import { Event } from "../event";
import { ProjectTable } from "./project.sql";

export namespace Project {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Project.id }),
      createdBy: z.string().meta({ description: "Id of the user who created it." }),
      name: z.string().min(1).max(200).meta({ description: "Display name." }),
      description: z.string().max(2000).nullable().meta({ description: "What it is for." }),
      image: z.string().nullable().meta({ description: "Cover image URL, or null for none." }),
    })
    .meta({
      ref: "Project",
      description: "A container for todos. Todos point at it through source/sourceID.",
      example: Examples.Project,
    });
  export type Info = z.infer<typeof Info>;

  const Patch = Info.pick({ name: true, description: true, image: true }).partial();

  export const create = fn(
    z.object({ name: Info.shape.name, description: Info.shape.description.optional() }),
    async (input) => {
      Actor.check({ project: ["create"] });
      const id = Identifier.create("project");
      return Database.transaction(async (tx) => {
        await tx.insert(ProjectTable).values({
          id,
          createdBy: Actor.userID(),
          name: input.name,
          description: input.description ?? null,
        });
        const project = found("Project", await fromID.force(id));
        await Event.publish({
          type: "project.created",
          source: "project",
          sourceID: id,
          data: { name: input.name },
          state: project,
        });
        return project;
      });
    },
  );

  export const list = fn(
    Common.Query(["name", "timeCreated"]).extend({ search: z.string().optional() }),
    (input) => {
      Actor.check({ project: ["read"] });
      const { page, pageSize, limit, offset } = Common.page(input);
      const conditions = [isNull(ProjectTable.timeDeleted)];
      if (input.search) conditions.push(ilike(ProjectTable.name, `%${input.search}%`));
      const where = and(...conditions);
      return Database.use(async (tx) => {
        const [rows, totalRows] = await Promise.all([
          tx
            .select()
            .from(ProjectTable)
            .where(where)
            .orderBy(...order(ProjectTable, input.sort, asc(ProjectTable.name)))
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(ProjectTable).where(where),
        ] as const);
        return { data: rows.map(serialize), page, pageSize, total: totalRows[0]?.total ?? 0 };
      });
    },
  );

  export const fromID = fn(Info.shape.id, (id) => {
    Actor.check({ project: ["read"] });
    return Database.use((tx) =>
      tx
        .select()
        .from(ProjectTable)
        .where(and(eq(ProjectTable.id, id), isNull(ProjectTable.timeDeleted)))
        .then((rows) => (rows[0] ? serialize(rows[0]) : null)),
    );
  });

  export const update = fn(Patch.extend({ id: Info.shape.id }), async ({ id, ...patch }) => {
    const before = found("Project", await fromID.force(id));
    Actor.check({ project: ["update"] }, before.createdBy);

    return Database.transaction(async (tx) => {
      await tx
        .update(ProjectTable)
        .set({ ...patch, timeUpdated: new Date() })
        .where(eq(ProjectTable.id, id));
      await Event.publish({
        type: "project.updated",
        source: "project",
        sourceID: id,
        data: { name: patch.name ?? before.name },
        state: { ...before, ...patch },
      });
    });
  });

  /**
   * Soft-deletes the project. Its todos keep pointing at it and stay reachable from the
   * unscoped views — nothing is orphaned, and undoing is one `timeDeleted` away.
   */
  export const remove = fn(Info.shape.id, async (id) => {
    const before = found("Project", await fromID.force(id));
    Actor.check({ project: ["delete"] }, before.createdBy);

    return Database.transaction(async (tx) => {
      await tx.update(ProjectTable).set({ timeDeleted: new Date() }).where(eq(ProjectTable.id, id));
      await Event.publish({
        type: "project.removed",
        source: "project",
        sourceID: id,
        data: { name: before.name },
        state: before,
      });
    });
  });

  function serialize(row: typeof ProjectTable.$inferSelect): Info {
    return {
      id: row.id,
      createdBy: row.createdBy,
      name: row.name,
      description: row.description,
      image: row.image,
    };
  }
}
