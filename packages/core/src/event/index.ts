import { z } from "zod";
import { and, arrayOverlaps, desc, eq } from "drizzle-orm";
import { fn } from "../util/fn";
import { Database } from "../drizzle";
import { Actor } from "../actor";
import { Common } from "../common";
import { Examples } from "../examples";
import { Identifier } from "../identifier";
import { EventTable } from "./event.sql";

export namespace Event {
  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Event.id }),
      userID: z.string().nullable(),
      type: z.string().meta({ example: Examples.Event.type }),
      source: z.string().nullable(),
      sourceID: z.string().nullable(),
      tags: z.string().array(),
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

  export const create = fn(
    z.object({
      type: z.string().min(1).max(128),
      source: z.string().min(1).max(64).optional(),
      sourceID: z.string().optional(),
      tags: z.string().array().max(20).optional(),
      data: z.record(z.string(), z.unknown()).optional(),
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

  export const list = fn(
    z.object({
      source: z.string().optional(),
      sourceID: z.string().optional(),
      type: z.string().optional(),
      tags: z.string().array().optional(),
      limit: z.number().min(1).max(200).optional(),
    }),
    (input) => {
      const conditions = [eq(EventTable.userID, Actor.userID())];
      if (input.source) conditions.push(eq(EventTable.source, input.source));
      if (input.sourceID) conditions.push(eq(EventTable.sourceID, input.sourceID));
      if (input.type) conditions.push(eq(EventTable.type, input.type));
      if (input.tags?.length) conditions.push(arrayOverlaps(EventTable.tags, input.tags));
      return Database.use((tx) =>
        tx
          .select()
          .from(EventTable)
          .where(and(...conditions))
          .orderBy(desc(EventTable.timeCreated))
          .limit(input.limit ?? 50)
          .then((rows) => rows.map(serialize)),
      );
    },
  );

  function serialize(row: typeof EventTable.$inferSelect): Info {
    return {
      id: row.id,
      userID: row.userID,
      type: row.type,
      source: row.source,
      sourceID: row.sourceID,
      tags: row.tags,
      data: row.data as Record<string, unknown>,
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
