import { describe, expect } from "bun:test";
import { z } from "zod";
import { Actor } from "../src/actor";
import { Database } from "../src/drizzle";
import { Identifier } from "../src/identifier";
import { run } from "../src/jobs";
import { Queue } from "../src/lib/queue";
import { memory } from "../src/lib/queue/adapter/memory";
import { Bus } from "../src/platform/bus";
import { withTestUser } from "./util";

const seen: { n: number; subject?: string; actor: string }[] = [];

const Ping = Bus.define("test.ping", z.object({ n: z.number() }));
const Quiet = Bus.define("test.quiet", z.object({}));

Bus.subscribe(Ping, async (event) => {
  const actor = Actor.use();
  seen.push({
    n: event.data.n,
    subject: event.subject,
    actor: actor.type === "user" ? actor.properties.userID : actor.type,
  });
});

/** Drains through `jobs.run`, the runner the worker targets use, so the actor is replayed. */
async function work() {
  let done = 0;
  while (await Queue.tick(run)) done++;
  return done;
}

describe("bus", () => {
  withTestUser("a subscriber gets the typed event as the publishing actor", async ({ userID }) => {
    seen.length = 0;
    const at = Identifier.create("event");
    await Queue.provide(memory(), async () => {
      const event = await Ping.publish({ n: 1 }, { subject: at });
      expect(event.specversion).toBe("1.0");
      expect(event.source).toBe("/test");
      await work();
    });
    expect(seen).toEqual([{ n: 1, subject: at, actor: userID }]);
  });

  withTestUser("an event with no subscriber acks cleanly", async () => {
    const queue = memory();
    await Queue.provide(queue, async () => {
      await Quiet.publish({});
      expect(await work()).toBe(1);
    });
    expect(queue.rows).toHaveLength(0);
  });

  withTestUser("a rolled-back write dispatches nothing", async () => {
    seen.length = 0;
    await Queue.provide(memory(), async () => {
      await Database.transaction(async () => {
        await Ping.publish({ n: 2 });
        throw new Error("rollback");
      }).catch(() => {});
      expect(await work()).toBe(0);
    });
    expect(seen).toHaveLength(0);
  });

  withTestUser("invalid data throws at publish", async () => {
    await expect(Ping.publish(JSON.parse('{"n":"two"}'))).rejects.toThrow();
  });

  withTestUser("a type takes one definition and one subscriber", async () => {
    expect(() => Bus.define("test.ping", z.object({}))).toThrow(/already defined/);
    expect(() => Bus.subscribe(Ping, async () => {})).toThrow(/already has a subscriber/);
  });
});
