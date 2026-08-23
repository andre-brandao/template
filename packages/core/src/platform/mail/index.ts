import { z } from "zod";
import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { Actor } from "../../actor";
import { Common } from "../../common";
import { Database } from "../../drizzle";
import { ErrorCodes, VisibleError } from "../../error";
import { Examples } from "../../examples";
import { Identifier } from "../../identifier";
import { Email } from "../../lib/email";
import { auto, Inbound } from "../../lib/email/inbound";
import { Storage } from "../../lib/storage";
import { Assert } from "../../util/assert";
import { fn } from "../../util/fn";
import { iso } from "../../util/fmt";
import { Log } from "../../util/log";
import { clean, Tags } from "../../util/tag";
import { Event } from "../event";
import { AttachmentTable } from "./attachment.sql";
import { DirectionValues, MessageTable } from "./mail.sql";
import { Mailbox } from "./mailbox";

export { Mailbox };

/**
 * Inbound and outbound mail on the shared team addresses. A conversation is a shared
 * `thread` value resolved once on arrival, and `from` is the join key every other feature
 * matches on — nothing here imports the features that read it.
 */
export namespace Mail {
  export const assert = Assert.create("Mail");

  const log = Log.create({ namespace: "core.mail" });

  export const Direction = z.enum(DirectionValues);
  export type Direction = z.infer<typeof Direction>;

  /** Not folders: each is a question asked of the columns, and none of them is exclusive. */
  export const View = z.enum(["inbox", "sent", "drafts", "trash"]);
  export type View = z.infer<typeof View>;

  export const Attachment = z
    .object({
      id: z.string().meta({ description: Common.IdDescription }),
      key: z.string().meta({ description: "Where the bytes sit on the disk." }),
      filename: z.string().meta({ description: "Name as the sender wrote it, sanitised." }),
      type: z.string().meta({ description: "MIME type.", example: "application/pdf" }),
      size: z.number().meta({ description: "Bytes." }),
      cid: z
        .string()
        .nullable()
        .meta({ description: "Set when the html body shows it inline as `cid:`." }),
    })
    .meta({ ref: "MailAttachment", description: "One file carried by a message." });
  export type Attachment = z.infer<typeof Attachment>;

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Mail.id }),
      thread: z.string().meta({ description: "The conversation. Its own id when new." }),
      mailbox: z.string().meta({ description: "Address it arrived on or went out from." }),
      direction: Direction.meta({ description: "`in` received, `out` sent or drafted." }),
      messageID: z
        .string()
        .nullable()
        .meta({ description: "RFC 5322 Message-ID. Null on a draft." }),
      inReplyTo: z.string().nullable().meta({ description: "The Message-ID this answers." }),
      refs: z.string().array().meta({ description: "The References chain." }),
      from: z.string().meta({ description: "Sender address, lowercased. The join key." }),
      to: z.string().array().meta({ description: "Recipients." }),
      cc: z.string().array().meta({ description: "Copied recipients." }),
      bcc: z.string().array().meta({ description: "Blind recipients. Only ever set outbound." }),
      subject: z.string().nullable().meta({ description: "Subject line." }),
      body: z.string().nullable().meta({ description: "Plain body." }),
      html: z.string().nullable().meta({ description: "Rich body, sanitise before display." }),
      snippet: z.string().nullable().meta({ description: "First 300 characters, for list rows." }),
      tags: Tags.meta({ description: "Free-form labels, shared by every message in the thread." }),
      source: z.string().nullable().meta({ description: "Kind of record it was filed on." }),
      sourceID: z.string().nullable().meta({ description: "Id of that record." }),
      createdBy: z.string().nullable().meta({ description: "Who wrote it. Null on inbound." }),
      attachments: Attachment.array().meta({ description: "Files carried, bytes excluded." }),
      timeSent: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When it left. Null on an outbound message means a draft." }),
      timeRead: z.iso.datetime().nullable().meta({ description: "Null until opened." }),
      timeCreated: z.iso.datetime().meta({ description: "When the row was written." }),
    })
    .meta({
      ref: "MailMessage",
      description: "One message, inbound or outbound, sent or still a draft.",
      example: Examples.Mail,
    });
  export type Info = z.infer<typeof Info>;

  /** A conversation as the list shows it: its newest sent message, plus what the rest imply. */
  export const Thread = z
    .object({
      id: z.string().meta({ description: "The thread id — what `Mail.thread` takes." }),
      message: z.string().meta({ description: "Id of the message this row is showing." }),
      mailbox: Info.shape.mailbox,
      from: Info.shape.from,
      subject: Info.shape.subject,
      snippet: Info.shape.snippet,
      tags: Info.shape.tags,
      source: Info.shape.source,
      sourceID: Info.shape.sourceID,
      count: z.number().meta({ description: "Messages in the conversation." }),
      unread: z.boolean().meta({ description: "Something received here has not been opened." }),
      draft: z.boolean().meta({ description: "Somebody has a reply half-written." }),
      files: z.boolean().meta({ description: "Some message in it carries an attachment." }),
      timeSent: Info.shape.timeSent,
      timeCreated: Info.shape.timeCreated,
    })
    .meta({
      ref: "MailThread",
      description: "One conversation, as a list row.",
      example: Examples.MailThread,
    });
  export type Thread = z.infer<typeof Thread>;

  /**
   * Stores one delivery. Runs as the system actor and checks nothing — there is no user
   * present when mail arrives. Returns null for every drop: an unknown recipient, a
   * redelivery, or an auto-reply is not an error, and a transport has nowhere to throw.
   */
  export const receive = fn(Inbound, async (input) => {
    const box = await recipient([...input.to, ...input.cc]);
    if (!box) return drop("no mailbox for any recipient", { to: input.to.join(",") });
    if (input.messageID && (await seen(box.address, input.messageID)))
      return drop("already delivered", { mailbox: box.address, messageID: input.messageID });
    if (auto(input.headers))
      return drop("auto-submitted", { mailbox: box.address, from: input.from });

    const id = Identifier.create("mail");
    const anchor = await ancestor(box.address, [input.inReplyTo, ...input.refs]);
    const match = anchor ?? (await sibling(box.address, input.subject, input.from));
    const files = await Promise.all(input.attachments.map((file) => store(id, file)));

    return Database.transaction(async (tx) => {
      await tx.insert(MessageTable).values({
        id,
        mailbox: box.address,
        direction: "in",
        // New conversations point at themselves, so nothing downstream coalesces.
        thread: match?.thread ?? id,
        messageID: input.messageID,
        inReplyTo: input.inReplyTo,
        refs: input.refs,
        from: input.from.toLowerCase(),
        to: input.to,
        cc: input.cc,
        subject: input.subject,
        body: input.body,
        html: input.html,
        snippet: snippet(input.body || input.html || ""),
        // Inherited so every message in a conversation carries the same thread-wide
        // fields — which is what lets the list read them off one row.
        tags: match?.tags ?? [],
        source: match?.source ?? null,
        sourceID: match?.sourceID ?? null,
        headers: input.headers,
        timeSent: input.timeSent ? new Date(input.timeSent) : new Date(),
      });
      if (files.length) await tx.insert(AttachmentTable).values(files);
      const stored = await assert.exists(fromID.force(id));
      // The audit log only: nothing outside the building subscribes to mail yet.
      await Event.create({
        type: "mail.received",
        source: "mail",
        sourceID: id,
        tags: stored.tags,
        data: { mailbox: box.address, from: stored.from, subject: stored.subject },
      });
      log.info("received", { mailbox: box.address, from: stored.from, thread: stored.thread });
      return stored;
    });
  });

  export const list = fn(
    Common.Query({
      mailbox: z.string().optional().meta({ description: "One of our addresses." }),
      address: z.string().optional().meta({
        description: "Mail to or from this address — the person-page join.",
        example: "jane@acme.io",
      }),
      domain: z.string().optional().meta({
        description: "Mail from anyone at this domain — the company-page join.",
        example: "acme.io",
      }),
      source: z.string().optional().meta({ description: "Threads filed on this kind of record." }),
      sourceID: z.string().optional().meta({ description: "Id of that record." }),
      tag: z.string().optional().meta({ description: "One label the thread wears." }),
      unread: z.boolean().optional().meta({ description: "Only threads with something unopened." }),
      view: View.optional().meta({
        description: "Which question to ask of the columns. Defaults to `inbox`.",
      }),
      search: z.string().optional().meta({ description: "Matches subject, body and addresses." }),
    }),
    (input) => {
      Actor.check({ mail: ["read"] });
      const { page, pageSize, limit, offset } = Common.page(input);
      const view = input.view ?? "inbox";
      const deleted =
        view === "trash" ? isNotNull(MessageTable.timeDeleted) : isNull(MessageTable.timeDeleted);

      return Database.use(async (tx) => {
        // A thread qualifies when *any* of its messages does, which is why a reply puts a
        // conversation in `sent` without taking it out of `inbox`.
        const qualifying = tx
          .select({ thread: MessageTable.thread })
          .from(MessageTable)
          .where(and(deleted, ...filters({ ...input, view })));
        const rows = tx
          .selectDistinctOn([MessageTable.thread], {
            id: MessageTable.thread,
            message: MessageTable.id,
            mailbox: MessageTable.mailbox,
            from: MessageTable.from,
            subject: MessageTable.subject,
            snippet: MessageTable.snippet,
            tags: MessageTable.tags,
            source: MessageTable.source,
            sourceID: MessageTable.sourceID,
            timeSent: MessageTable.timeSent,
            timeCreated: MessageTable.timeCreated,
            count: sql<number>`cast(count(*) ${partition} as int)`.as("count"),
            unread:
              sql<boolean>`bool_or(${MessageTable.timeRead} is null and ${MessageTable.direction} = 'in') ${partition}`.as(
                "unread",
              ),
            draft: sql<boolean>`bool_or(${MessageTable.timeSent} is null) ${partition}`.as("draft"),
            files:
              sql<boolean>`bool_or(exists (select 1 from ${AttachmentTable} where ${AttachmentTable.message} = ${MessageTable.id} and ${AttachmentTable.timeDeleted} is null)) ${partition}`.as(
                "files",
              ),
          })
          .from(MessageTable)
          .where(and(deleted, inArray(MessageTable.thread, qualifying)))
          // The representative is the newest sent message, falling back to the draft when
          // the conversation has nothing but one.
          .orderBy(MessageTable.thread, sql`${MessageTable.timeSent} desc nulls last`)
          .as("threads");

        const where = input.unread ? eq(rows.unread, true) : undefined;
        const [data, totals] = await Promise.all([
          tx
            .select()
            .from(rows)
            .where(where)
            .orderBy(sql`coalesce(${rows.timeSent}, ${rows.timeCreated}) desc`)
            .limit(limit)
            .offset(offset),
          tx.select({ total: count() }).from(rows).where(where),
        ] as const);
        return {
          data: data.map((row) => ({
            ...row,
            timeSent: iso(row.timeSent),
            timeCreated: row.timeCreated.toISOString(),
          })),
          page,
          pageSize,
          total: totals[0]?.total ?? 0,
        };
      });
    },
    {
      title: "List mail threads",
      description:
        "Conversations, newest first. Narrow by mailbox, view (inbox/sent/drafts/trash), tag, search, or by who they involve — `address` for one person, `domain` for a whole company, `source`/`sourceID` for threads filed on a record.",
    },
  );

  export const thread = fn(
    Thread.shape.id,
    (id) => {
      Actor.check({ mail: ["read"] });
      return Database.use(async (tx) => {
        const rows = await tx
          .select()
          .from(MessageTable)
          .where(eq(MessageTable.thread, id))
          .orderBy(sql`coalesce(${MessageTable.timeSent}, ${MessageTable.timeCreated}) asc`);
        return rows.map((row) => serialize(row, []));
      }).then(attach);
    },
    {
      title: "Read a thread",
      description:
        "Every message in one conversation, oldest first, inbound and outbound interleaved. Marks nothing read — `Mail.read` does that.",
    },
  );

  export const fromID = fn(
    Info.shape.id,
    (id) => {
      Actor.check({ mail: ["read"] });
      return Database.use((tx) =>
        tx
          .select()
          .from(MessageTable)
          .where(eq(MessageTable.id, id))
          .then((rows) => (rows[0] ? [serialize(rows[0], [])] : [])),
      )
        .then(attach)
        .then((rows) => rows[0] ?? null);
    },
    { title: "Get message", description: "Fetch a single message by id, with its attachments." },
  );

  /** Creates or updates the thread's single draft. Last write wins, by design. */
  export const draft = fn(
    z.object({
      id: Info.shape.id.optional().meta({ description: "The draft to overwrite." }),
      mailbox: Info.shape.mailbox,
      thread: Thread.shape.id.optional().meta({ description: "Reply into this conversation." }),
      to: z.string().array().optional(),
      cc: z.string().array().optional(),
      bcc: z.string().array().optional(),
      subject: z.string().max(1000).optional(),
      body: z.string().max(200000).optional(),
    }),
    async (input) => {
      Actor.check({ mail: ["create"] });
      const box = await assert.exists(Mailbox.get(input.mailbox));
      const existing = input.id
        ? await assert.exists(unsent(input.id))
        : input.thread
          ? await unsent(input.thread, "thread")
          : null;
      const id = existing?.id ?? Identifier.create("mail");
      const fields = {
        createdBy: Actor.userID(),
        to: input.to ?? [],
        cc: input.cc ?? [],
        bcc: input.bcc ?? [],
        subject: input.subject ?? null,
        body: input.body ?? null,
        snippet: snippet(input.body ?? ""),
        timeUpdated: new Date(),
      };
      await Database.use(async (tx) => {
        if (existing)
          return tx.update(MessageTable).set(fields).where(eq(MessageTable.id, existing.id));
        return tx.insert(MessageTable).values({
          ...fields,
          id,
          mailbox: box.address,
          direction: "out",
          // A new draft is a thread of one, so composing needs no special case downstream.
          thread: input.thread ?? id,
          from: box.address,
        });
      });
      return assert.exists(fromID.force(id));
    },
    {
      title: "Save draft",
      description:
        "Create or overwrite the unsent reply on a thread — or, with no thread, start a new conversation. Autosave calls this; the last write wins.",
    },
  );

  /** Delivers the draft and stamps it. The same row becomes the sent message. */
  export const send = fn(
    Info.shape.id,
    async (id) => {
      const row = await assert.exists(unsent(id));
      Actor.check({ mail: ["create"] }, row.createdBy ?? undefined);
      if (![...row.to, ...row.cc, ...row.bcc].length)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.MISSING_REQUIRED_FIELD,
          "A draft needs at least one recipient",
        );
      const box = await assert.exists(Mailbox.get(row.mailbox));
      const parent = await previous(row.thread, row.id);
      const messageID = `${row.id}@${box.address.split("@")[1]}`;
      const refs = clean([...(parent?.refs ?? []), parent?.messageID ?? ""]);
      const headers = {
        "Message-ID": angle(messageID),
        ...(parent?.messageID ? { "In-Reply-To": angle(parent.messageID) } : {}),
        ...(refs.length ? { References: refs.map(angle).join(" ") } : {}),
      };
      // The signature is appended here rather than baked into the draft, so editing one
      // can never leave a stale copy of it in the body.
      const body = [row.body, box.signature].filter(Boolean).join("\n\n");

      // Delivery first: a send that throws leaves an editable draft, not a row claiming
      // to have been sent.
      await Email.send({
        from: box.fromName ? `${box.fromName} <${box.address}>` : box.address,
        to: row.to,
        cc: row.cc,
        bcc: row.bcc,
        subject: row.subject ?? "",
        body,
        headers,
      });

      return Database.transaction(async (tx) => {
        await tx
          .update(MessageTable)
          .set({
            messageID,
            inReplyTo: parent?.messageID ?? null,
            refs,
            body,
            snippet: snippet(body),
            headers,
            timeSent: new Date(),
            timeUpdated: new Date(),
          })
          .where(eq(MessageTable.id, row.id));
        const sent = await assert.exists(fromID.force(row.id));
        await Event.create({
          type: "mail.sent",
          source: "mail",
          sourceID: sent.id,
          tags: sent.tags,
          data: { mailbox: sent.mailbox, to: sent.to, subject: sent.subject },
        });
        return sent;
      });
    },
    {
      title: "Send draft",
      description:
        "Deliver a draft and stamp it sent. The mailbox's signature and the thread's reply headers are added on the way out.",
    },
  );

  export const discard = fn(
    Info.shape.id,
    async (id) => {
      const row = await assert.exists(unsent(id));
      Actor.check({ mail: ["delete"] }, row.createdBy ?? undefined);
      // Hard delete — nothing ever sent it, so there is nothing to recover.
      await Database.transaction(async (tx) => {
        await tx.delete(AttachmentTable).where(eq(AttachmentTable.message, id));
        await tx.delete(MessageTable).where(eq(MessageTable.id, id));
      });
    },
    { title: "Discard draft", description: "Delete an unsent draft outright." },
  );

  export const read = fn(
    z.object({
      thread: Thread.shape.id,
      read: z
        .boolean()
        .optional()
        .meta({ description: "False marks it unread. Defaults to true." }),
    }),
    (input) => {
      Actor.check({ mail: ["update"] });
      return every(input.thread, { timeRead: input.read === false ? null : new Date() });
    },
    { title: "Mark thread read", description: "Mark a whole conversation read, or unread." },
  );

  /** The explicit link, for what address matching cannot answer. Both null unfiles it. */
  export const file = fn(
    z.object({
      thread: Thread.shape.id,
      source: Info.shape.source,
      sourceID: Info.shape.sourceID,
    }),
    (input) => {
      Actor.check({ mail: ["update"] });
      return every(input.thread, { source: input.source, sourceID: input.sourceID });
    },
    {
      title: "File a thread",
      description:
        "Attach a conversation to a specific record when matching on address cannot say which one it belongs to. Clearing both fields unfiles it.",
    },
  );

  export const tag = fn(
    z.object({ thread: Thread.shape.id, tags: Tags }),
    (input) => {
      Actor.check({ mail: ["update"] });
      return every(input.thread, { tags: clean(input.tags) });
    },
    { title: "Tag a thread", description: "Replace the labels on a whole conversation." },
  );

  export const remove = fn(
    Thread.shape.id,
    (id) => {
      Actor.check({ mail: ["delete"] });
      return every(id, { timeDeleted: new Date() });
    },
    {
      title: "Delete a thread",
      description: "Move a whole conversation to trash. There is no archive; this is it.",
    },
  );

  export const restore = fn(
    Thread.shape.id,
    (id) => {
      Actor.check({ mail: ["delete"] });
      return every(id, { timeDeleted: null });
    },
    { title: "Restore a thread", description: "Bring a conversation back out of trash." },
  );

  function serialize(row: typeof MessageTable.$inferSelect, files: Attachment[]): Info {
    return {
      id: row.id,
      thread: row.thread,
      mailbox: row.mailbox,
      direction: row.direction,
      messageID: row.messageID,
      inReplyTo: row.inReplyTo,
      refs: row.refs,
      from: row.from,
      to: row.to,
      cc: row.cc,
      bcc: row.bcc,
      subject: row.subject,
      body: row.body,
      html: row.html,
      snippet: row.snippet,
      tags: row.tags,
      source: row.source,
      sourceID: row.sourceID,
      createdBy: row.createdBy,
      attachments: files,
      timeSent: iso(row.timeSent),
      timeRead: iso(row.timeRead),
      timeCreated: row.timeCreated.toISOString(),
    };
  }

  // === UTILS ===

  /** One window over the conversation, written once — every thread aggregate reuses it. */
  const partition = sql`over (partition by ${MessageTable.thread})`;

  const angle = (id: string) => `<${id}>`;

  /** Everything a list row can be narrowed by. Applied to the qualifying-thread select. */
  function filters(input: {
    mailbox?: string;
    address?: string;
    domain?: string;
    source?: string;
    sourceID?: string;
    tag?: string;
    view: View;
    search?: string;
  }) {
    const conditions: (SQL | undefined)[] = [];
    if (input.view === "inbox") conditions.push(eq(MessageTable.direction, "in"));
    if (input.view === "sent")
      conditions.push(eq(MessageTable.direction, "out"), isNotNull(MessageTable.timeSent));
    if (input.view === "drafts")
      conditions.push(eq(MessageTable.direction, "out"), isNull(MessageTable.timeSent));
    if (input.mailbox) conditions.push(eq(MessageTable.mailbox, input.mailbox.toLowerCase()));
    if (input.address) {
      const address = input.address.toLowerCase();
      conditions.push(
        or(
          eq(MessageTable.from, address),
          arrayContains(MessageTable.to, [address]),
          arrayContains(MessageTable.cc, [address]),
        ),
      );
    }
    if (input.domain)
      conditions.push(
        sql`split_part(${MessageTable.from}, '@', 2) = ${input.domain.toLowerCase()}`,
      );
    if (input.source) conditions.push(eq(MessageTable.source, input.source));
    if (input.sourceID) conditions.push(eq(MessageTable.sourceID, input.sourceID));
    if (input.tag) conditions.push(arrayContains(MessageTable.tags, [input.tag]));
    if (input.search) {
      const term = `%${input.search}%`;
      conditions.push(
        or(
          ilike(MessageTable.subject, term),
          ilike(MessageTable.body, term),
          ilike(MessageTable.from, term),
        ),
      );
    }
    return conditions;
  }

  /** Fills in the attachments for a page of messages in one query, not one per message. */
  async function attach(rows: Info[]) {
    if (!rows.length) return rows;
    const files = await Database.use((tx) =>
      tx
        .select()
        .from(AttachmentTable)
        .where(
          and(
            inArray(
              AttachmentTable.message,
              rows.map((row) => row.id),
            ),
            isNull(AttachmentTable.timeDeleted),
          ),
        ),
    );
    return rows.map((row) => ({
      ...row,
      attachments: files.filter((file) => file.message === row.id).map(part),
    }));
  }

  const part = (row: typeof AttachmentTable.$inferSelect): Attachment => ({
    id: row.id,
    key: row.key,
    filename: row.filename,
    type: row.type,
    size: row.size,
    cid: row.cid,
  });

  /** Every message in a conversation — the price of not having a thread table. */
  async function every(thread: string, fields: Partial<typeof MessageTable.$inferInsert>) {
    await Database.use((tx) =>
      tx
        .update(MessageTable)
        .set({ ...fields, timeUpdated: new Date() })
        .where(eq(MessageTable.thread, thread)),
    );
  }

  /** The first `to`/`cc` address that is one of ours — and the whole unknown-recipient policy. */
  async function recipient(candidates: string[]) {
    for (const address of candidates) {
      const box = await Mailbox.get(address);
      if (box) return box;
    }
    return null;
  }

  function drop(reason: string, tags: Record<string, string>) {
    log.info(`dropped: ${reason}`, tags);
    return null;
  }

  function seen(mailbox: string, messageID: string) {
    return Database.use((tx) =>
      tx
        .select({ id: MessageTable.id })
        .from(MessageTable)
        .where(and(eq(MessageTable.mailbox, mailbox), eq(MessageTable.messageID, messageID)))
        .limit(1)
        .then((rows) => rows.length > 0),
    );
  }

  /**
   * The oldest ancestor we hold, tried against the whole chain at once — being copied in
   * halfway means the root named in `References` never reached us but a later one did.
   */
  function ancestor(mailbox: string, chain: (string | null)[]) {
    const ids = chain.filter((id): id is string => Boolean(id));
    if (!ids.length) return null;
    return Database.use((tx) =>
      tx
        .select({
          thread: MessageTable.thread,
          tags: MessageTable.tags,
          source: MessageTable.source,
          sourceID: MessageTable.sourceID,
        })
        .from(MessageTable)
        .where(and(eq(MessageTable.mailbox, mailbox), inArray(MessageTable.messageID, ids)))
        .orderBy(asc(MessageTable.timeSent))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    );
  }

  /** The narrow fallback, bounded to 30 days so an old "Re: hello" cannot swallow a new one. */
  function sibling(mailbox: string, subject: string, from: string) {
    const bare = subject.replace(/^((re|fwd?|fw):\s*)+/i, "").trim();
    if (!bare) return null;
    return Database.use((tx) =>
      tx
        .select({
          thread: MessageTable.thread,
          tags: MessageTable.tags,
          source: MessageTable.source,
          sourceID: MessageTable.sourceID,
        })
        .from(MessageTable)
        .where(
          and(
            eq(MessageTable.mailbox, mailbox),
            eq(MessageTable.from, from.toLowerCase()),
            sql`regexp_replace(${MessageTable.subject}, '^((re|fwd?|fw):\\s*)+', '', 'i') ilike ${bare}`,
            sql`${MessageTable.timeSent} > now() - interval '30 days'`,
          ),
        )
        .orderBy(desc(MessageTable.timeSent))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    );
  }

  /** The newest message in the thread that actually left — what a reply threads onto. */
  function previous(thread: string, exclude: string) {
    return Database.use((tx) =>
      tx
        .select({ messageID: MessageTable.messageID, refs: MessageTable.refs })
        .from(MessageTable)
        .where(
          and(
            eq(MessageTable.thread, thread),
            isNotNull(MessageTable.messageID),
            sql`${MessageTable.id} <> ${exclude}`,
          ),
        )
        .orderBy(desc(MessageTable.timeSent))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    );
  }

  /** A draft, by its own id or by the thread holding it. Null when there is none. */
  function unsent(id: string, by: "id" | "thread" = "id") {
    return Database.use((tx) =>
      tx
        .select()
        .from(MessageTable)
        .where(
          and(
            eq(by === "id" ? MessageTable.id : MessageTable.thread, id),
            eq(MessageTable.direction, "out"),
            isNull(MessageTable.timeSent),
            isNull(MessageTable.timeDeleted),
          ),
        )
        .limit(1)
        .then((rows) => (rows[0] ? serialize(rows[0], []) : null)),
    );
  }

  /** Bytes to the disk under the message and the part's own id, so same-named parts survive. */
  async function store(message: string, file: Inbound["attachments"][number]) {
    const id = Identifier.create("attachment");
    // Anything a filesystem or an object key would choke on, as the reference had it.
    const filename = file.filename.replace(/[/\\:*?"<>|\u0000-\u001f]/g, "_");
    const key = `mail/attachments/${message}/${id}/${filename}`;
    await Storage.disk().put(key, file.bytes, file.type);
    return {
      id,
      message,
      key,
      filename,
      type: file.type,
      size: file.bytes.byteLength,
      cid: file.cid,
    };
  }

  /** Stripped once on write, rather than on every list render. */
  function snippet(body: string) {
    return body
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
  }
}
