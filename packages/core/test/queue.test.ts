import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Actor } from "../src/actor";
import { Database } from "../src/drizzle";
import { Queue } from "../src/queue";
import { db } from "../src/queue/adapter/db";
import { memory } from "../src/queue/adapter/memory";
import { JobTable } from "../src/queue/queue.sql";
import { withTestUser } from "./util";

const seen: string[] = [];

const greet = Queue.define("test.greet", z.object({ name: z.string() }), async (input) => {
  seen.push(`${input.name}:${Actor.use().type}`);
});

const asUser = Queue.define("test.actor", z.object({}), async () => {
  seen.push(Actor.userID());
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

  withTestUser("db stores the job and runs it as the pushing user", async ({ userID }) => {
    seen.length = 0;
    await Queue.provide(db(), async () => {
      const id = await asUser.push({});
      const row = await Database.use((tx) =>
        tx
          .select()
          .from(JobTable)
          .where(eq(JobTable.id, id))
          .then((rows) => rows[0]),
      );
      expect(row?.name).toBe("test.actor");
      expect(row?.userID).toBe(userID);
      expect(seen).toEqual([]);

      await Actor.provide("public", {}, async () => {
        expect(await Queue.drain()).toBe(1);
        expect(seen).toEqual([userID]);
      });

      expect(
        await Database.use((tx) => tx.select().from(JobTable).where(eq(JobTable.id, id))),
      ).toHaveLength(0);
    });
  });

  withTestUser("db reclaims a job whose reservation timed out", async () => {
    await Queue.provide(db({ timeout: 0 }), async () => {
      await greet.push({ name: "stalled" });
      const first = await Queue.use().reserve();
      const again = await Queue.use().reserve();
      expect(again?.id).toBe(first!.id);
      expect(again?.attempts).toBe(2);
      await Queue.use().ack(again!);
    });
  });

  withTestUser("db buries a job once retries run out", async () => {
    await Queue.provide(db({ retries: 1 }), async () => {
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
