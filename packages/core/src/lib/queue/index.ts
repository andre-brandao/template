import { z } from "zod";
import { Context } from "../../context";
import { Log } from "../../util/log";
import type * as port from "./port";
import { db, type Runner } from "./adapter/db";
import { memory } from "./adapter/memory";
import { sync } from "./adapter/sync";

/**
 * Background jobs over a swappable driver, Laravel-style. `define` names a handler and
 * its payload schema; `push` hands the payload to whichever driver the target provided.
 * The `sync` driver runs it inline, `db` leaves it for `work()` in a worker process.
 *
 * Knows nothing about who is acting: `push` stores whatever `userID` the caller hands
 * it, and the runner decides what that means — the worker targets pass `jobs.run` to
 * `work`, which replays each job as its pushing actor; the `sync` driver runs inline
 * under the pusher's own.
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
      push: (input: z.infer<S>, opts?: { delay?: number; userID?: string | null }) =>
        push(name, schema.parse(input), opts),
    };
  }

  export function push(
    name: string,
    payload: unknown,
    opts?: { delay?: number; userID?: string | null },
  ) {
    log.info("push", { name, delay: opts?.delay ?? 0 });
    return use().push({ name, payload, userID: opts?.userID ?? null, delay: opts?.delay });
  }

  /**
   * Runs one job's handler, throwing on failure. `tick` uses it for the polling
   * drivers; the Cloudflare consumer calls it directly, since that driver hands jobs
   * over as a pushed batch instead of something to reserve.
   */
  export async function run(job: Job) {
    const def = jobs.get(job.name);
    if (!def) throw new Error(`No handler defined for job ${job.name}`);
    await def.cb(def.schema.parse(job.payload));
  }

  /** Runs at most one job. False when nothing was due. */
  export async function tick(runner: (job: Job) => Promise<unknown> = run) {
    const queue = use();
    const job = await queue.reserve();
    if (!job) return false;

    const err = await Promise.resolve()
      .then(() => runner(job))
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
  export async function work(
    opts: { interval?: number; signal?: AbortSignal; run?: (job: Job) => Promise<unknown> } = {},
  ) {
    const interval = opts.interval ?? 1000;
    log.info("worker started", { interval });
    while (!opts.signal?.aborted) {
      const done = await tick(opts.run).catch((err) => {
        log.error(err instanceof Error ? err : new Error(String(err)));
        return false;
      });
      if (!done) await new Promise((wake) => setTimeout(wake, interval));
    }
    log.info("worker stopped");
  }

  /** `QUEUE_DRIVER=sync|memory|db`, default `sync`. The `db` driver needs the app's transaction runner. */
  export function fromEnv(env: Record<string, string | undefined>, database?: Runner): Port {
    const driver = env.QUEUE_DRIVER ?? "sync";
    const cfg = {
      retries: env.QUEUE_RETRIES ? Number(env.QUEUE_RETRIES) : undefined,
      backoff: env.QUEUE_BACKOFF ? Number(env.QUEUE_BACKOFF) : undefined,
      timeout: env.QUEUE_TIMEOUT ? Number(env.QUEUE_TIMEOUT) : undefined,
    };
    log.info("using queue driver", { driver });

    if (driver === "db") {
      if (!database) throw new Error("QUEUE_DRIVER=db needs a database runner: fromEnv(env, use)");
      return db({ use: database, ...cfg });
    }
    if (driver === "memory") return memory(cfg);
    return sync(run);
  }
}
