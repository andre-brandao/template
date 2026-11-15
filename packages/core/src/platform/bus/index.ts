import { z } from "zod";
import { CloudEvent as Envelope } from "./cloudevent";
import { Identity } from "../../identity";
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

  /**
   * Computed at publish and carried beside the envelope, SST-style. Beside, not inside: a
   * CloudEvent extension must be a primitive, and webhooks get the envelope alone.
   */
  export const Metadata = z.object({ identity: Identity.Info });
  export type Metadata = z.infer<typeof Metadata>;

  export function metadata(): Metadata {
    return { identity: Identity.use() };
  }

  const defs = new Map<string, z.ZodType>();
  const subs = new Map<string, (event: any, meta: Metadata) => Promise<unknown>>();

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
        const actor = Identity.use();
        const userID = Identity.known() ? Identity.userID() : undefined;
        // Name the agent or internal code, so an audit tells "copilot for andre" from andre.
        const agent =
          actor.type === "agent" || actor.type === "internal"
            ? [`${actor.type}:${actor.properties.name}`]
            : [];
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
            identity: actor,
            type,
            source,
            sourceID: opts.subject,
            tags: clean([`actor:${actor.type}`, ...agent, ...(opts.tags ?? [])]),
            data: event.data as Record<string, unknown>,
            timeCreated: new Date(event.time),
          }),
        );
        // After the caller's transaction commits, so a rolled-back write emits nothing.
        await Database.effect(async () => {
          // The queue replays the identity, so the subscriber runs as the publisher.
          await job.push(
            { event: event.toJSON(), metadata: metadata() },
            { identity: Identity.stamp() },
          );
          if (open) await Webhook.job.push({ event: event.toJSON() });
        });
        return event;
      },
    };
  }

  /** Binds the one handler for an event. It runs in the worker, as the publishing actor. */
  export function subscribe<S extends z.ZodType>(
    def: { type: string; schema: S },
    cb: (event: CloudEvent<z.infer<S>>, meta: Metadata) => Promise<unknown>,
  ) {
    if (subs.has(def.type)) throw new Error(`Event ${def.type} already has a subscriber`);
    subs.set(def.type, cb);
    return { type: def.type };
  }

  /** Every event gets one; the publisher can't know whether a subscriber exists. */
  export const job = Queue.define(
    "bus.dispatch",
    z.object({ event: Envelope.schema, metadata: Metadata }),
    async (payload) => {
      const cb = subs.get(payload.event.type);
      if (!cb) return;
      const event = new Envelope(payload.event);
      await cb(
        event.cloneWith({ data: defs.get(event.type)!.parse(event.data) }),
        payload.metadata,
      );
    },
  );
}
