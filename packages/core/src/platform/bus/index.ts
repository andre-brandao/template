import { z } from "zod";
import { CloudEvent as Envelope } from "./cloudevent";
import { Actor } from "../../actor";
import { Database } from "../../drizzle";
import { Identifier } from "../../identifier";
import { Queue } from "../../lib/queue";
import { clean } from "../../util/tag";
import { Webhook } from "../webhook";
import { EventTable } from "../event/event.sql";

/**
 * Declared, typed events. A slice defines its events (`Todo.Event.Created`) and publishes
 * them; a handler elsewhere subscribes. One subscriber per type — fan-out is a broker's job.
 */
export namespace Bus {
  export type CloudEvent<T = unknown> = Envelope<T>;

  /** Names this app in every event's `source` (`template/todo`). A fork renames it. */
  export const app = "template";

  const defs = new Map<string, z.ZodType>();
  const subs = new Map<string, (event: any) => Promise<unknown>>();

  /** Declares an event. Public types (the webhook catalog) also go out to webhooks. */
  export function define<S extends z.ZodType>(type: string, schema: S) {
    if (defs.has(type)) throw new Error(`Event ${type} is already defined`);
    defs.set(type, schema);
    const open = (Webhook.types as readonly string[]).includes(type);
    const source = type.split(".")[0]!;
    return {
      type,
      schema,
      public: open,
      /** Records the event in the caller's transaction; delivery waits for the commit. */
      async publish(data: z.input<S>, opts: { subject?: string; tags?: string[] } = {}) {
        const actor = Actor.use();
        const userID = actor.type === "user" ? actor.properties.userID : undefined;
        const event = new Envelope({
          id: Identifier.create("event"),
          source: `${app}/${source}`,
          type,
          subject: opts.subject,
          data: schema.parse(data) as z.infer<S>,
          // The spec's Auth Context extension: who triggered it.
          authtype: actor.type === "public" ? "unauthenticated" : actor.type,
          ...(userID ? { authid: userID } : {}),
        });
        await Database.use((tx) =>
          tx.insert(EventTable).values({
            id: event.id,
            userID: userID ?? null,
            type,
            source,
            sourceID: opts.subject,
            tags: clean([`actor:${actor.type}`, ...(opts.tags ?? [])]),
            data: event.data as Record<string, unknown>,
            timeCreated: new Date(event.time),
          }),
        );
        // After the caller's transaction commits, so a rolled-back write emits nothing.
        await Database.effect(async () => {
          await job.push(event.toJSON(), { userID });
          if (open) await Webhook.job.push({ event: event.toJSON() });
        });
        return event;
      },
    };
  }

  /** Binds the one handler for an event. It runs in the worker, as the publishing actor. */
  export function subscribe<S extends z.ZodType>(
    def: { type: string; schema: S },
    cb: (event: CloudEvent<z.infer<S>>) => Promise<unknown>,
  ) {
    if (subs.has(def.type)) throw new Error(`Event ${def.type} already has a subscriber`);
    subs.set(def.type, cb);
    return { type: def.type };
  }

  /** Every event gets one; the publisher can't know whether a subscriber exists. */
  export const job = Queue.define("bus.dispatch", Envelope.schema, async (payload) => {
    const cb = subs.get(payload.type);
    if (!cb) return;
    const event = new Envelope(payload);
    await cb(event.cloneWith({ data: defs.get(event.type)!.parse(event.data) }));
  });
}
