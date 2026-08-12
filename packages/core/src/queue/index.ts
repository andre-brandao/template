import { z } from "zod";
import { Actor } from "../actor";
import { Context } from "../context";
import { found } from "../error";
import { User } from "../user";
import { Log } from "../util/log";
import type * as port from "./port";
import { db } from "./adapter/db";
import { memory } from "./adapter/memory";
import { sync } from "./adapter/sync";

/**
 * Background jobs over a swappable driver, Laravel-style. `define` names a handler and
 * its payload schema; `push` hands the payload to whichever driver the target provided.
 * The `sync` driver runs it inline, `db` leaves it for `work()` in a worker process.
 */
export namespace Queue {
  const log = Log.create({ namespace: "core.queue" });

  export type Job = port.Job;
  export type Port = port.Port;

  const ctx = Context.create<Port>();
  const jobs = new Map<string, { schema: z.ZodType; cb: (input: any) => Promise<void> }>();
  let fallback: Port | undefined;

  export function provide<R>(port: Port, fn: () => R): R {
    return ctx.provide(port, fn);
  }

  /** Curried form of `provide` for composition via `Context.withProviders`. */
  export function provider(port: Port) {
    return <R>(fn: () => R) => provide(port, fn);
  }

  /**
   * Same env fallback as `Database.use()`, for callers that bypass a target's
   * per-request wrapper (chiefly tests). Cached so the `memory` driver keeps
   * its jobs across calls.
   */
  export function use(): Port {
    try {
      return ctx.use();
    } catch (err) {
      if (!(err instanceof Context.NotFound)) throw err;
      fallback ??= fromEnv(process.env);
      return fallback;
    }
  }

  /**
   * Registers a handler and returns a typed dispatcher. The worker resolves handlers by
   * name, so a process running `work()` must import every module that defines one.
   */
  export function define<S extends z.ZodType>(
    name: string,
    schema: S,
    cb: (input: z.infer<S>) => Promise<unknown>,
  ) {
    jobs.set(name, { schema, cb: async (input) => void (await cb(input)) });
    return {
      name,
      schema,
      push: (input: z.infer<S>, opts?: { delay?: number }) => push(name, schema.parse(input), opts),
    };
  }

  export function push(name: string, payload: unknown, opts?: { delay?: number }) {
    log.info("push", { name, delay: opts?.delay ?? 0 });
    return use().push({ name, payload, userID: actor(), delay: opts?.delay });
  }

  /** The pushing user, so the handler runs as them later. Null outside a user context. */
  function actor() {
    try {
      const info = Actor.use();
      return info.type === "user" ? info.properties.userID : null;
    } catch (err) {
      if (!(err instanceof Context.NotFound)) throw err;
      return null;
    }
  }

  /**
   * Runs one job's handler as its pushing actor, throwing on failure. `tick` uses it for
   * the polling drivers; the Cloudflare consumer calls it directly, since that driver
   * hands jobs over as a pushed batch instead of something to reserve.
   */
  export async function run(job: Job) {
    const def = jobs.get(job.name);
    if (!def) throw new Error(`No handler defined for job ${job.name}`);
    const input = def.schema.parse(job.payload);
    // No pusher means the app itself queued this, so it runs unchecked. A pushed job
    // replays as its user, at whatever role that user holds *now*.
    if (!job.userID) return Actor.provide("system", {}, () => def.cb(input));
    const row = found("User", await User.fromID(job.userID));
    return Actor.provide("user", { userID: job.userID, role: row.role }, () => def.cb(input));
  }

  /** Runs at most one job. False when nothing was due. */
  export async function tick() {
    const queue = use();
    const job = await queue.reserve();
    if (!job) return false;

    const err = await Promise.resolve()
      .then(() => run(job))
      .then(
        () => null,
        (e) => (e instanceof Error ? e : new Error(String(e))),
      );
    if (!err) {
      await queue.ack(job);
      return true;
    }

    log.warn("job failed", { name: job.name, id: job.id, attempts: job.attempts });
    log.error(err);
    await queue.fail(job, err);
    return true;
  }

  /** Runs everything currently due, then returns how many jobs it handled. */
  export async function drain(max = 1000) {
    let done = 0;
    while (done < max && (await tick())) done++;
    return done;
  }

  /**
   * Worker loop — polls until the signal aborts. A backend that throws (a database
   * blip, say) costs one interval rather than the whole process: `tick` already
   * contains handler failures, so anything reaching here is the driver itself.
   */
  export async function work(opts: { interval?: number; signal?: AbortSignal } = {}) {
    const interval = opts.interval ?? 1000;
    log.info("worker started", { interval });
    while (!opts.signal?.aborted) {
      const done = await tick().catch((err) => {
        log.error(err instanceof Error ? err : new Error(String(err)));
        return false;
      });
      if (!done) await new Promise((wake) => setTimeout(wake, interval));
    }
    log.info("worker stopped");
  }

  /** `QUEUE_DRIVER=sync|memory|db`, default `sync`. */
  export function fromEnv(env: Record<string, string | undefined>): Port {
    const driver = env.QUEUE_DRIVER ?? "sync";
    const cfg = {
      retries: env.QUEUE_RETRIES ? Number(env.QUEUE_RETRIES) : undefined,
      backoff: env.QUEUE_BACKOFF ? Number(env.QUEUE_BACKOFF) : undefined,
      timeout: env.QUEUE_TIMEOUT ? Number(env.QUEUE_TIMEOUT) : undefined,
    };
    log.info("using queue driver", { driver });

    if (driver === "db") return db(cfg);
    if (driver === "memory") return memory(cfg);
    return sync(run);
  }
}
