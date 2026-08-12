import { z } from "zod";
import { and, arrayOverlaps, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { UserTable } from "../user/user.sql";
import { EventTable } from "./event.sql";

export namespace Event {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Event.id }),
      userID: z.string().nullable(),
      /**
       * Who caused the entry, joined in the same query rather than looked up per row: every
       * log line and timeline entry wants the name, and the left join costs nothing.
       */
      user: z.object({ id: z.string(), name: z.string(), image: z.string().nullable() }).nullable(),
      type: z.string().min(1).max(128).meta({ example: Examples.Event.type }),
      source: z.string().min(1).max(64).nullable(),
      sourceID: z.string().nullable(),
      tags: z.string().array().max(20),
      data: z.record(z.string(), z.unknown()),
      timeCreated: z.iso.datetime(),
    })
    .meta({
      ref: "Event",
      description: "An immutable audit-log entry.",
      example: Examples.Event,
    });
  export type Info = z.infer<typeof Info>;

  function actor() {
    const info = Actor.use();
    return {
      userID: info.type === "user" ? info.properties.userID : null,
      tag: `actor:${info.type}`,
    };
  }

  /** The columns a caller writes; everything else about an entry is derived here. */
  export const create = fn(
    Info.pick({ type: true, source: true, sourceID: true, tags: true, data: true }).partial({
      source: true,
      sourceID: true,
      tags: true,
      data: true,
    }),
    async (input) => {
      const id = Identifier.create("event");
      const who = actor();
      await Database.use((tx) =>
        tx.insert(EventTable).values({
          id,
          userID: who.userID,
          type: input.type,
          source: input.source,
          sourceID: input.sourceID,
          tags: [...new Set([who.tag, ...(input.tags ?? [])])],
          data: input.data ?? {},
        }),
      );
      return id;
    },
  );

  /** Every filter is a column, so the shapes come from `Info` rather than being restated. */
  const Filter = z
    .object({
      type: Info.shape.type,
      source: Info.shape.source.unwrap(),
      sourceID: Info.shape.sourceID.unwrap(),
      userID: Info.shape.userID.unwrap(),
      tags: Info.shape.tags,
      search: z.string(),
    })
    .partial();

  export const list = fn(Common.PaginatedInput.extend(Filter.shape), (input) => {
    if (!input.sourceID) Actor.check({ admin: ["read"] });

    const { page, pageSize, limit, offset } = Common.page(input);

    const conditions: (SQL)[] = [];
    if (input.source) conditions.push(eq(EventTable.source, input.source));
    if (input.sourceID) conditions.push(eq(EventTable.sourceID, input.sourceID));
    if (input.type) conditions.push(eq(EventTable.type, input.type));
    if (input.userID) conditions.push(eq(EventTable.userID, input.userID));
    if (input.tags?.length) conditions.push(arrayOverlaps(EventTable.tags, input.tags));
    if (input.search) conditions.push(ilike(EventTable.type, `%${input.search}%`));

    const where = and(...conditions);

    return Database.use(async (tx) => {
      const [rows, totalRows] = await Promise.all([
        tx
          .select({
            event: EventTable,
            user: { id: UserTable.id, name: UserTable.name, image: UserTable.image },
          })
          .from(EventTable)
          .leftJoin(UserTable, eq(UserTable.id, EventTable.userID))
          .where(where)
          .orderBy(desc(EventTable.timeCreated))
          .limit(limit)
          .offset(offset),
        tx.select({ total: count() }).from(EventTable).where(where),
      ] as const);
      return {
        data: rows.map((row) => serialize(row.event, row.user)),
        page,
        pageSize,
        total: totalRows[0]?.total ?? 0,
      };
    });
  });

  /** The values the log filters offer, taken from what has actually been recorded. */
  export const facets = fn(z.void(), () => {
    Actor.check({ admin: ["read"] });
    return Database.use(async (tx) => {
      const [types, sources] = await Promise.all([
        tx.selectDistinct({ v: EventTable.type }).from(EventTable).orderBy(asc(EventTable.type)),
        tx
          .selectDistinct({ v: EventTable.source })
          .from(EventTable)
          .orderBy(asc(EventTable.source)),
      ] as const);
      return {
        types: types.map((row) => row.v),
        sources: sources.map((row) => row.v).filter((v) => v !== null),
      };
    });
  });

  function serialize(row: typeof EventTable.$inferSelect, user: Info["user"]): Info {
    return {
      id: row.id,
      userID: row.userID,
      // The left join yields a row of nulls for system and public actors.
      user: user?.id ? user : null,
      type: row.type,
      source: row.source,
      sourceID: row.sourceID,
      tags: row.tags,
      data: row.data as Record<string, unknown>,
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
