import { z } from "zod";
import { Actor } from "@template/core/actor";
import { Database, and, asc, desc, eq, isNull } from "@template/core/drizzle";
import { ErrorCodes, VisibleError } from "@template/core/error";
import { fn } from "@template/core/util/fn";
import { Assert } from "@template/core/util/assert";
import {
  ConversationMessageTable,
  ConversationTable,
  RoleValues,
} from "@template/core/conversation/conversation.sql";

/**
 * The agent's history: each user's own threads, recorded by the run's middleware. Persists
 * and reads only; running the agent is `Agent`'s.
 */
export namespace Conversation {
  const assert = Assert.create("Conversation");

  export const Role = z.enum(RoleValues);

  // A key of `agents`; free text here so this module never imports the registry.
  export const Agent = z.string().min(1).max(64);

  export const Info = z.object({
    id: z.string(),
    agent: Agent,
    thread: z.string().min(1).max(255),
    title: z.string().nullable(),
    timeCreated: z.string(),
    timeUpdated: z.string(),
  });
  export type Info = z.infer<typeof Info>;

  // A page of the history; one more row is read to know whether another page follows.
  const SIZE = 30;

  /** Appends a run to the actor's thread, opening the conversation on its first run. */
  export const record = fn(
    z.object({
      agent: Agent,
      thread: Info.shape.thread,
      run: z
        .object({
          id: z.string().optional(),
          model: z.string().optional(),
          tokensIn: z.number().int().optional(),
          tokensOut: z.number().int().optional(),
          durationMs: z.number().int().optional(),
          error: z.string().optional(),
        })
        .optional(),
      messages: z.array(
        z.object({
          role: Role,
          content: z.unknown(),
          text: z.string().nullable().optional(),
          tools: z.array(z.string()).optional(),
        }),
      ),
    }),
    async (input) => {
      const user = Actor.userID();
      const first = input.messages.find((message) => message.role === "user" && message.text);
      return Database.transaction(async (tx) => {
        const made = await tx
          .insert(ConversationTable)
          .values({
            agent: input.agent,
            thread: input.thread,
            userID: user,
            title: first?.text?.trim().slice(0, 200) || null,
          })
          .onConflictDoNothing()
          .returning()
          .then((rows) => rows.at(0));
        const row =
          made ??
          (await assert.exists(
            tx
              .select()
              .from(ConversationTable)
              .where(
                and(
                  eq(ConversationTable.thread, input.thread),
                  isNull(ConversationTable.timeDeleted),
                ),
              )
              .then((rows) => rows.at(0)),
          ));
        // The thread id comes from the browser: never append to someone else's.
        if (row.userID !== user)
          throw new VisibleError(
            "forbidden",
            ErrorCodes.Permission.FORBIDDEN,
            "This thread belongs to another user",
          );

        const last = input.messages.length - 1;
        const { id: runID, ...metrics } = input.run ?? {};
        if (input.messages.length)
          await tx.insert(ConversationMessageTable).values(
            input.messages.map((message, i) => ({
              conversationID: row.id,
              runID,
              role: message.role,
              content: message.content ?? {},
              text: message.text ?? null,
              tools: message.tools ?? [],
              ...(i === last ? metrics : {}),
            })),
          );
        await tx
          .update(ConversationTable)
          .set({ timeUpdated: new Date() })
          .where(eq(ConversationTable.id, row.id));
        return serialize(row);
      });
    },
  );

  /** The actor's own conversations, most recent activity first. */
  export const list = fn(
    z.object({ agent: Agent, page: z.number().int().min(1).default(1) }),
    async (input) => {
      const rows = await Database.use((tx) =>
        tx
          .select()
          .from(ConversationTable)
          .where(
            and(
              eq(ConversationTable.userID, Actor.userID()),
              eq(ConversationTable.agent, input.agent),
              isNull(ConversationTable.timeDeleted),
            ),
          )
          .orderBy(desc(ConversationTable.timeUpdated), desc(ConversationTable.id))
          .limit(SIZE + 1)
          .offset((input.page - 1) * SIZE),
      );
      return { data: rows.slice(0, SIZE).map(serialize), more: rows.length > SIZE };
    },
  );

  /** One of the actor's conversations with every message, oldest first. */
  export const fromID = fn(z.uuid(), (id) =>
    Database.use(async (tx) => {
      const row = await assert.exists(
        tx
          .select()
          .from(ConversationTable)
          .where(
            and(
              eq(ConversationTable.id, id),
              eq(ConversationTable.userID, Actor.userID()),
              isNull(ConversationTable.timeDeleted),
            ),
          )
          .then((rows) => rows.at(0)),
      );
      const messages = await tx
        .select({
          role: ConversationMessageTable.role,
          content: ConversationMessageTable.content,
        })
        .from(ConversationMessageTable)
        .where(eq(ConversationMessageTable.conversationID, id))
        .orderBy(asc(ConversationMessageTable.id));
      return { ...serialize(row), messages };
    }),
  );

  /** Soft-deletes one of the actor's conversations; its thread can't be resumed after. */
  export const remove = fn(z.uuid(), (id) =>
    Database.use((tx) =>
      tx
        .update(ConversationTable)
        .set({ timeDeleted: new Date() })
        .where(and(eq(ConversationTable.id, id), eq(ConversationTable.userID, Actor.userID()))),
    ).then(() => undefined),
  );

  function serialize(row: typeof ConversationTable.$inferSelect): Info {
    return {
      id: row.id,
      agent: row.agent,
      thread: row.thread,
      title: row.title,
      timeCreated: row.timeCreated.toISOString(),
      timeUpdated: row.timeUpdated.toISOString(),
    };
  }
}
