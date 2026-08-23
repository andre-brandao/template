import { sql } from "drizzle-orm";
import { index, jsonb, pgTable as table, text, uniqueIndex } from "drizzle-orm/pg-core";
import { id, timestamp, timestamps, ulid } from "../../drizzle/types";

export const DirectionValues = ["in", "out"] as const;

export const MessageTable = table(
  "mail_message",
  {
    id: id(),
    ...timestamps,
    // Null on inbound — nobody created it. Set on a draft, which is how the composer
    // names whoever last saved it.
    createdBy: ulid("created_by"),
    // The address this arrived on or went out from — the disk key, not a row id.
    mailbox: text().notNull(),
    direction: text({ enum: DirectionValues }).notNull(),
    // Resolved on the way in, never recomputed. Points at its own id when new, so a
    // conversation is always `where thread = ?` with no coalescing.
    thread: ulid("thread").notNull(),
    // The RFC 5322 Message-ID as it appeared, angle brackets stripped. Null on a draft.
    messageID: text("message_id"),
    inReplyTo: text("in_reply_to"),
    refs: text().array().notNull().default([]),
    // Lowercased. The column every other feature joins against.
    from: text().notNull(),
    to: text().array().notNull().default([]),
    cc: text().array().notNull().default([]),
    // Only ever populated on what we send — a received message cannot know it.
    bcc: text().array().notNull().default([]),
    subject: text(),
    body: text(),
    html: text(),
    // Stripped from the body once on write, rather than on every list render.
    snippet: text(),
    tags: text().array().notNull().default([]),
    // Everything as received, including DKIM results and `X-` headers. Nothing reads it
    // today; it is what explains a bad parse after the fact.
    headers: jsonb().$type<Record<string, string>>().notNull().default({}),
    // Inbound: the sender's `Date`. Outbound: when it left. Null means an unsent draft,
    // which is only reachable when direction is `out`.
    timeSent: timestamp("time_sent"),
    timeRead: timestamp("time_read"),
    // The explicit link, when matching on address cannot answer the question.
    source: text(),
    sourceID: ulid("source_id"),
  },
  (table) => [
    index("mail_thread").on(table.mailbox, table.thread, table.timeSent),
    index("mail_from").on(table.from),
    // The company page asks for a whole domain, and a trailing-wildcard LIKE cannot use
    // the plain index — so the domain is indexed as an expression and compared directly.
    index("mail_domain").on(sql`split_part(${table.from}, '@', 2)`),
    index("mail_source").on(table.source, table.sourceID),
    index("mail_tags").using("gin", table.tags),
    index("mail_to").using("gin", table.to),
    // Absorbs provider redelivery. Postgres admits many NULLs, so drafts are unaffected.
    uniqueIndex("mail_message_id").on(table.mailbox, table.messageID),
  ],
);
