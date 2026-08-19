import { z } from "zod";
import { and, arrayOverlaps, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { fn } from "../../util/fn";
import { Database } from "../../drizzle";
import { Actor } from "../../actor";
import { Common } from "../../common";
import { Examples } from "../../examples";
import { Identifier } from "../../identifier";
import { clean, Tags } from "../../util/tag";
import { UserTable } from "../../user/user.sql";
import { orderBy } from "../../drizzle/order";
import { Webhook } from "../webhook";
import { EventTable } from "./event.sql";

export namespace Event {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Event.id }),
      userID: z
        .string()
        .nullable()
        .meta({ description: "Who caused it. Null for system and public actors." }),
      user: z
        .object({
          id: z.string(),
          name: z.string(),
          image: z.string().nullable(),
        })
        .nullable()
        .meta({ description: "That user, joined in so a log row can name them." }),
      type: z.string().min(1).max(128).meta({
        description: "What happened, like `todo.created`.",
        example: Examples.Event.type,
      }),
      source: z
        .string()
        .min(1)
        .max(64)
        .nullable()
        .meta({ description: "Kind of entity it happened to, like `todo`." }),
      sourceID: z.string().nullable().meta({ description: "Id of that entity." }),
      tags: Tags.meta({
        description: "Filter labels. Always carries the actor kind, like `actor:user`.",
      }),
      data: z
        .record(z.string(), z.unknown())
        .meta({ description: "Type-specific payload. For updates, the before/after diff." }),
      timeCreated: z.iso.datetime().meta({ description: "When it was recorded." }),
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
          tags: clean([who.tag, ...(input.tags ?? [])]),
          data: input.data ?? {},
        }),
      );
      return id;
    },
  );

  /**
   * An event that also leaves the building. Same audit row as `create`, plus a queued
   * fan-out to every matching webhook. `state` is the only thing subscribers see of the
   * payload and is never stored, which is why this is a second function rather than a flag.
   */
  export const publish = fn(
    Info.pick({ source: true, sourceID: true, tags: true, data: true })
      .partial()
      .extend({
        type: z.enum(Webhook.types),
        state: z.record(z.string(), z.unknown()).optional(),
      }),
    async (input) => {
      const id = await create(input);
      // After the caller's transaction commits, so a rolled-back write emits nothing.
      await Database.effect(() =>
        Webhook.job.push({
          event: {
            id,
            type: input.type,
            source: input.source,
            sourceID: input.sourceID,
            // The subscriber gets the resulting state, not the audit diff in `input.data`.
            data: input.state,
            timeCreated: new Date().toISOString(),
          },
        }),
      );
      return id;
    },
  );

  export const list = fn(
    Common.Query(["type", "source", "user", "timeCreated"]).extend({
      type: Info.shape.type.optional(),
      source: Info.shape.source.unwrap().optional(),
      sourceID: Info.shape.sourceID.unwrap().optional(),
      userID: Info.shape.userID.unwrap().optional(),
      tags: Info.shape.tags.optional(),
      search: z.string().optional(),
    }),
    (input) => {
      if (!input.sourceID) Actor.check({ admin: ["read"] });

      const { page, pageSize, limit, offset } = Common.page(input);

      const conditions: SQL[] = [];
      if (input.source) conditions.push(eq(EventTable.source, input.source));
      if (input.sourceID) conditions.push(eq(EventTable.sourceID, input.sourceID));
      if (input.type) conditions.push(eq(EventTable.type, input.type));
      if (input.userID) conditions.push(eq(EventTable.userID, input.userID));
      if (input.tags?.length) conditions.push(arrayOverlaps(EventTable.tags, input.tags));
      // The log's one search box covers both columns a reader has in hand: the event name
      // and the id of the row it happened to.
      if (input.search)
        conditions.push(
          or(
            ilike(EventTable.type, `%${input.search}%`),
            ilike(EventTable.sourceID, `%${input.search}%`),
          ) as SQL,
        );

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
            .orderBy(
              ...orderBy(EventTable, input.sort, desc(EventTable.timeCreated), {
                user: UserTable.name,
              }),
            )
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
    },
  );

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
