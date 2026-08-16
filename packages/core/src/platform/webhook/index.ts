import { z } from "zod";
import { and, arrayContains, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { fn } from "../../util/fn";
import { iso } from "../../util/fmt";
import { found } from "../../error";
import { Actor } from "../../actor";
import { Common } from "../../common";
import { Database } from "../../drizzle";
import { Examples } from "../../examples";
import { Identifier } from "../../identifier";
import { Queue } from "../../lib/queue";
import { Log } from "../../util/log";
import { sign } from "../../util/sign";
import { token } from "../../util/token";
import { Types } from "./types";
import { WebhookTable } from "./webhook.sql";

/** Consecutive failed POSTs before a subscription turns itself off. One dead event costs 4. */
const LIMIT = 20;

const NAME = "webhook.deliver";

/**
 * Outbound HTTP subscriptions, fed by `Event.publish`. Delivery runs in the queue worker,
 * never on the request path, and retries re-push only the endpoints that actually failed.
 */
export namespace Webhook {
  const log = Log.create({ namespace: "core.webhook" });

  export const types = Types;

  export const Info = z
    .object({
      id: z.string().meta({ description: Common.IdDescription, example: Examples.Webhook.id }),
      url: z.url().max(2000).meta({ description: "Where deliveries are POSTed." }),
      secret: z.string().meta({ description: "Signing secret. Handed back in full to admins." }),
      display: z.string().meta({ description: "Masked secret, safe to show in a list." }),
      types: z
        .enum(Types)
        .array()
        .meta({ description: "Event types to receive. Empty means every public type." }),
      enabled: z.boolean().meta({
        description: "Turns itself off after too many failures. Re-enabling clears the count.",
      }),
      failures: z.number().meta({ description: "Consecutive failed deliveries." }),
      lastStatus: z
        .number()
        .nullable()
        .meta({ description: "HTTP status of the last attempt. Null if it never answered." }),
      timeDelivered: z.iso
        .datetime()
        .nullable()
        .meta({ description: "When a delivery last succeeded." }),
      timeCreated: z.iso.datetime().meta({ description: "When the subscription was created." }),
    })
    .meta({
      ref: "Webhook",
      description: "An endpoint that receives published events over HTTP.",
      example: Examples.Webhook,
    });
  export type Info = z.infer<typeof Info>;

  const Patch = Info.pick({ url: true, types: true, enabled: true }).partial();

  export const create = fn(
    Info.pick({ url: true, types: true }).partial({ types: true }),
    (input) => {
      Actor.check({ webhook: ["create"] });
      return Database.use((tx) =>
        tx
          .insert(WebhookTable)
          .values({
            id: Identifier.create("webhook"),
            createdBy: Actor.userID(),
            url: input.url,
            secret: token("whsec_"),
            types: input.types ?? [],
          })
          .returning()
          .then((rows) => serialize(rows[0]!)),
      );
    },
  );

  export const list = fn(z.void(), () => {
    Actor.check({ webhook: ["read"] });
    return Database.use((tx) =>
      tx
        .select()
        .from(WebhookTable)
        .where(isNull(WebhookTable.timeDeleted))
        .orderBy(desc(WebhookTable.timeCreated))
        .then((rows) => rows.map((row) => serialize(row))),
    );
  });

  /** Re-enabling clears the failure count, so a fixed endpoint doesn't trip the limit again. */
  export const update = fn(Patch.extend({ id: Info.shape.id }), async ({ id, ...patch }) => {
    Actor.check({ webhook: ["update"] });
    found(
      "Webhook",
      await Database.use((tx) =>
        tx
          .update(WebhookTable)
          .set({ ...patch, timeUpdated: new Date(), ...(patch.enabled ? { failures: 0 } : {}) })
          .where(and(eq(WebhookTable.id, id), isNull(WebhookTable.timeDeleted)))
          .returning({ id: WebhookTable.id })
          .then((rows) => rows.at(0)),
      ),
    );
  });

  export const remove = fn(Info.shape.id, async (id) => {
    Actor.check({ webhook: ["delete"] });
    found(
      "Webhook",
      await Database.use((tx) =>
        tx
          .update(WebhookTable)
          .set({ timeDeleted: new Date() })
          .where(and(eq(WebhookTable.id, id), isNull(WebhookTable.timeDeleted)))
          .returning({ id: WebhookTable.id })
          .then((rows) => rows.at(0)),
      ),
    );
  });

  /**
   * What a subscriber receives: which event fired, what it happened to, and that thing's
   * state afterwards. `data` is the publisher's `state` — carried by the job, never stored.
   * The event's own `data` is the audit diff and stays internal.
   */
  export const Payload = z.object({
    id: z.string(),
    type: z.enum(Types),
    source: z.string().nullable().optional(),
    sourceID: z.string().nullable().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    timeCreated: z.iso.datetime(),
  });
  export type Payload = z.infer<typeof Payload>;

  /**
   * One job per event, fanning out to every matching subscription. A failed endpoint comes
   * back as its own job carrying just the ids that failed, so a healthy endpoint is never
   * delivered the same event twice because a sibling was down.
   */
  export const job = Queue.define(
    NAME,
    z.object({ event: Payload, ids: z.string().array().optional(), try: z.number().optional() }),
    async (input) => {
      const rows = await Database.use((tx) =>
        tx
          .select()
          .from(WebhookTable)
          .where(
            and(
              eq(WebhookTable.enabled, true),
              isNull(WebhookTable.timeDeleted),
              // A retry targets the endpoints that failed; a first pass matches on type.
              input.ids
                ? inArray(WebhookTable.id, input.ids)
                : or(
                    sql`cardinality(${WebhookTable.types}) = 0`,
                    arrayContains(WebhookTable.types, [input.event.type]),
                  ),
            ),
          ),
      );

      const failed = (await Promise.all(rows.map((row) => post(row, input.event)))).filter(
        (id) => id !== null,
      );
      const attempt = input.try ?? 0;
      if (!failed.length || attempt >= 3) return;
      await Queue.push(
        NAME,
        { ...input, ids: failed, try: attempt + 1 },
        { delay: 30 * 2 ** attempt },
      );
    },
  );

  /** Returns the id on failure and null on success, so one bad endpoint can't abort the rest. */
  async function post(row: typeof WebhookTable.$inferSelect, event: Payload) {
    const body = JSON.stringify(event);
    const time = Math.floor(Date.now() / 1000);
    const res = await fetch(row.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // The event id is stable across retries, so receivers can dedupe on it.
        "x-webhook-id": event.id,
        "x-webhook-timestamp": String(time),
        "x-webhook-signature": await sign(row.secret, body, time),
      },
      body,
      // The queue has no per-job timeout, so a hung endpoint would stall the whole worker.
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null);

    if (res?.ok) {
      await Database.use((tx) =>
        tx
          .update(WebhookTable)
          .set({ failures: 0, lastStatus: res.status, timeDelivered: new Date() })
          .where(eq(WebhookTable.id, row.id)),
      );
      return null;
    }

    log.warn("delivery failed", { id: row.id, url: row.url, status: res?.status ?? null });
    await Database.use((tx) =>
      tx
        .update(WebhookTable)
        .set({
          failures: sql`${WebhookTable.failures} + 1`,
          enabled: sql`${WebhookTable.failures} + 1 < ${LIMIT}`,
          lastStatus: res?.status ?? null,
        })
        .where(eq(WebhookTable.id, row.id)),
    );
    return row.id;
  }

  function serialize(row: typeof WebhookTable.$inferSelect): Info {
    return {
      id: row.id,
      url: row.url,
      secret: row.secret,
      display: `${row.secret.slice(0, 10)}...${row.secret.slice(-4)}`,
      types: row.types as Info["types"],
      enabled: row.enabled,
      failures: row.failures,
      lastStatus: row.lastStatus,
      timeDelivered: iso(row.timeDelivered),
      timeCreated: row.timeCreated.toISOString(),
    };
  }
}
