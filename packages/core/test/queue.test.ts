import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Actor } from "../src/actor";
import { Database } from "../src/drizzle";
import { run } from "../src/jobs";
import { Queue } from "../src/lib/queue";
import { cloudflare, type Producer } from "../src/lib/queue/adapter/cloudflare";
import { db } from "../src/lib/queue/adapter/db";
import { memory } from "../src/lib/queue/adapter/memory";
import type { Job } from "../src/lib/queue/port";
import { JobTable } from "../src/lib/queue/queue.sql";
import { withTestUser } from "./util";

const seen: string[] = [];

/** What the real binding answers with — the adapter ignores it, the type doesn't. */
const sendResponse = { metadata: { metrics: { backlogCount: 0, backlogBytes: 0 } } };

// Handlers run under whatever actor the runner gives them — the worker targets pass
// `jobs.run`, which replays the pusher; the `sync` driver inherits the pusher's own.
const greet = Queue.define("test.greet", z.object({ name: z.string() }), async (input) => {
  seen.push(`${input.name}:${Actor.use().type}`);
});

const boom = Queue.define("test.boom", z.object({}), async () => {
  seen.push("boom");
  throw new Error("nope");
});

describe("queue", () => {
  it("sync runs the job inline at push time", async () => {
    seen.length = 0;
    // `sync` runs handlers itself, so it needs the module's runner — `fromEnv` wires it.
    await Actor.provide("public", {}, () =>
      Queue.provide(Queue.fromEnv({ QUEUE_DRIVER: "sync" }), async () => {
        await greet.push({ name: "ada" });
        expect(seen).toEqual(["ada:public"]);
        expect(await Queue.tick()).toBe(false);
      }),
    );
  });

  it("sync surfaces a failing job to the caller", async () => {
    await Actor.provide("public", {}, () =>
      Queue.provide(Queue.fromEnv({ QUEUE_DRIVER: "sync" }), async () => {
        await expect(boom.push({})).rejects.toThrow("nope");
      }),
    );
  });

  it("memory holds the job until it is drained", async () => {
    seen.length = 0;
    const queue = memory();
    await Actor.provide("public", {}, () =>
      Queue.provide(queue, async () => {
        await greet.push({ name: "grace" });
        expect(seen).toEqual([]);
        expect(queue.rows).toHaveLength(1);

        expect(await Queue.drain()).toBe(1);
        expect(seen).toEqual(["grace:public"]);
        expect(queue.rows).toHaveLength(0);
      }),
    );
  });

  it("memory retries a failing job, then buries it", async () => {
    seen.length = 0;
    const queue = memory({ retries: 2 });
    await Actor.provide("public", {}, () =>
      Queue.provide(queue, async () => {
        await boom.push({});
        expect(await Queue.drain()).toBe(2);
        expect(seen).toEqual(["boom", "boom"]);
        expect(queue.rows[0]?.attempts).toBe(2);
        expect(queue.rows[0]?.error).toBe("nope");
        expect(await Queue.tick()).toBe(false);
      }),
    );
  });

  it("a delayed job is not runnable yet", async () => {
    const queue = memory();
    await Actor.provide("public", {}, () =>
      Queue.provide(queue, async () => {
        await greet.push({ name: "later" }, { delay: 60 });
        expect(await Queue.drain()).toBe(0);
        expect(queue.rows).toHaveLength(1);
      }),
    );
  });

  it("an unknown job name fails instead of hanging", async () => {
    const queue = memory({ retries: 1 });
    await Actor.provide("public", {}, () =>
      Queue.provide(queue, async () => {
        await Queue.push("test.missing", {});
        expect(await Queue.drain()).toBe(1);
        expect(queue.rows[0]?.error).toBe("No handler defined for job test.missing");
      }),
    );
  });

  it("the worker loop outlives a broken driver", async () => {
    const abort = new AbortController();
    let tries = 0;
    const broken = {
      ...memory(),
      async reserve(): Promise<null> {
        tries++;
        if (tries === 3) abort.abort();
        throw new Error("db down");
      },
    };

    await Queue.provide(broken, () => Queue.work({ interval: 1, signal: abort.signal }));
    expect(tries).toBe(3);
  });

  it("cloudflare hands the job to the binding instead of running it", async () => {
    seen.length = 0;
    const sent: { body: Job; delay?: number }[] = [];
    const binding: Producer = {
      async send(body, opts) {
        sent.push({ body, delay: opts?.delaySeconds });
        return sendResponse;
      },
    };

    await Actor.provide("public", {}, () =>
      Queue.provide(cloudflare(binding), async () => {
        const id = await greet.push({ name: "ada" }, { delay: 30 });
        expect(id).toStartWith("job_");
        expect(sent[0]?.body).toEqual({
          id,
          name: "test.greet",
          payload: { name: "ada" },
          userID: null,
          attempts: 0,
        });
        expect(sent[0]?.delay).toBe(30);
        expect(seen).toEqual([]);

        // Nothing to poll — Cloudflare pushes the batch to the consumer worker.
        expect(await Queue.drain()).toBe(0);
      }),
    );

    // What the consumer does with each message it receives — no pusher, so system.
    await run({ ...sent[0]!.body, attempts: 1 });
    expect(seen).toEqual(["ada:system"]);
  });

  withTestUser("cloudflare captures the pushing user for the consumer", async ({ userID }) => {
    seen.length = 0;
    const sent: Job[] = [];
    await Queue.provide(
      cloudflare({
        async send(body) {
          sent.push(body);
          return sendResponse;
        },
      }),
      () => greet.push({ name: "meta" }, { userID }),
    );

    expect(sent[0]?.userID).toBe(userID);
    await run({ ...sent[0]!, attempts: 1 });
    expect(seen).toEqual(["meta:user"]);
  });

  withTestUser("db stores the job with its pusher, the worker runs it", async ({ userID }) => {
    seen.length = 0;
    await Queue.provide(db({ use: Database.use }), async () => {
      const id = await greet.push({ name: "stored" }, { userID });
      const row = await Database.use((tx) =>
        tx
          .select()
          .from(JobTable)
          .where(eq(JobTable.id, id))
          .then((rows) => rows[0]),
      );
      expect(row?.name).toBe("test.greet");
      expect(row?.userID).toBe(userID);
      expect(seen).toEqual([]);

      // The worker loop hands `jobs.run` to `tick`, replaying the pusher.
      expect(await Queue.tick(run)).toBe(true);
      expect(seen).toEqual(["stored:user"]);

      expect(
        await Database.use((tx) => tx.select().from(JobTable).where(eq(JobTable.id, id))),
      ).toHaveLength(0);
    });
  });

  withTestUser("db reclaims a job whose reservation timed out", async () => {
    await Queue.provide(db({ use: Database.use, timeout: 0 }), async () => {
      await greet.push({ name: "stalled" });
      const first = await Queue.use().reserve();
      const again = await Queue.use().reserve();
      expect(again?.id).toBe(first!.id);
      expect(again?.attempts).toBe(2);
      await Queue.use().ack(again!);
    });
  });

  withTestUser("db buries a job once retries run out", async () => {
    await Queue.provide(db({ use: Database.use, retries: 1 }), async () => {
      const id = await boom.push({});
      expect(await Queue.drain()).toBe(1);

      const row = await Database.use((tx) =>
        tx
          .select()
          .from(JobTable)
          .where(eq(JobTable.id, id))
          .then((rows) => rows[0]),
      );
      expect(row?.timeFailed).not.toBeNull();
      expect(row?.error).toBe("nope");
      expect(await Queue.tick()).toBe(false);
    });
  });
});
