import { sql } from "drizzle-orm";
export * from "drizzle-orm";
import {
  PgAsyncTransaction,
  type PgQueryResultHKT,
  type PgTransactionConfig,
} from "drizzle-orm/pg-core";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm/relations";
import pg from "postgres";
import { Context } from "../context";
import { Log } from "../util/log";

export namespace Database {
  export const DEFAULT_URL = "postgresql://postgres:password@localhost:5432/postgres";
  const log = Log.create({ namespace: "drizzle" });

  export type Transaction = PgAsyncTransaction<
    PgQueryResultHKT,
    ExtractTablesWithRelations<Record<any, never>, Record<any, never>>
  >;

  export type TxOrDb = Transaction | PostgresJsDatabase;

  const TransactionContext = Context.create<{
    tx: TxOrDb;
    effects: (() => void | Promise<void>)[];
  }>();

  /** A connection pool and the drizzle instance over it. Build one with `create`. */
  export type Client = { db: PostgresJsDatabase; sql: ReturnType<typeof pg> };

  const DatabaseContext = Context.create<Client>();
  let fallback: Client | undefined;

  /**
   * Builds a pool. Long-lived processes create one at startup and `provide` it per
   * request — a client per request leaks a pool per request. Workers are the exception:
   * they forbid reusing a socket across requests, so they create one each time.
   */
  export function create(
    url = process.env.DATABASE_URL ?? DEFAULT_URL,
    opts: pg.Options<{}> = {},
  ): Client {
    const sql = pg(url, {
      connect_timeout: 10,
      prepare: false,
      // A shared client serves the whole process, so it needs room for concurrent
      // requests. pglite accepts exactly one connection — dev sets PG_MAX=1 for it.
      max: Number(process.env.PG_MAX ?? 10),
      idle_timeout: 20,
      // pglite emits a DEBUG notice per parse/bind; postgres.js console.logs every notice by default
      onnotice: (notice) => {
        if (notice.severity === "DEBUG") return;
        log.info(notice.message ?? "notice", { severity: notice.severity, code: notice.code });
      },
      ...opts,
    });
    return {
      sql,
      db: drizzle({
        client: sql,
        logger:
          process.env.DRIZZLE_LOG === "true"
            ? {
                logQuery(query, params) {
                  log.info("query", { query });
                  log.info("params", { params });
                },
              }
            : undefined,
      }),
    };
  }

  function db(): PostgresJsDatabase {
    try {
      return DatabaseContext.use().db;
    } catch (err) {
      if (!(err instanceof Context.NotFound)) {
        throw err;
      }

      log.warn("no database context, falling back to env");
      fallback ??= create();
      return fallback.db;
    }
  }

  function current() {
    try {
      return TransactionContext.use();
    } catch (err) {
      if (err instanceof Context.NotFound) {
        return;
      }
      throw err;
    }
  }

  export async function use<T>(callback: (tx: TxOrDb) => Promise<T>): Promise<T> {
    const existing = current();
    if (existing) {
      return callback(existing.tx);
    }
    const tx = db();
    const effects: (() => void | Promise<void>)[] = [];
    const result = await TransactionContext.provide({ tx, effects }, () => callback(tx));
    await Promise.all(effects.map((effect) => effect()));
    return result;
  }

  /** Scopes a client to `fn` — everything under it reads through that pool. */
  export function provide<T>(client: Client, fn: () => T): T {
    return DatabaseContext.provide(client, fn);
  }

  /** Curried form of `provide` for composition via `Context.withProviders`. */
  export function provider(client: Client) {
    return <R>(fn: () => R) => DatabaseContext.provide(client, fn);
  }

  /**
   * Closes the pool — lets pglite's single connection pass between dev processes.
   * The client is spent afterwards; further queries throw.
   */
  export function release(client: Client) {
    return client.sql.end({ timeout: 5 });
  }

  export async function effect(effect: () => any | Promise<any>): Promise<void> {
    const existing = current();
    if (existing) {
      existing.effects.push(effect);
      return;
    }
    await effect();
  }

  export async function transaction<T>(
    callback: (tx: TxOrDb) => Promise<T>,
    config: PgTransactionConfig = { isolationLevel: "read committed" },
  ): Promise<T> {
    const existing = current();
    if (existing) {
      return callback(existing.tx);
    }

    const effects: (() => void | Promise<void>)[] = [];
    const result = await db().transaction(
      async (tx) => TransactionContext.provide({ tx, effects }, () => callback(tx)),
      config,
    );
    await Promise.all(effects.map((effect) => effect()));
    return result as T;
  }

  export function fn<Input, T>(callback: (input: Input, trx: TxOrDb) => Promise<T>) {
    return (input: Input) => use(async (tx) => callback(input, tx));
  }

  export async function healthcheck(): Promise<{
    status: "ok" | "degraded";
    message: string;
    cause?: string;
  }> {
    try {
      await Database.use((tx) => tx.execute(sql`SELECT 1`, "objects"));
      return { status: "ok", message: "ok" };
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      log.error(e);
      const cause = e.cause instanceof Error ? e.cause.message : undefined;
      if (cause) log.error(e.cause as Error);
      return { status: "degraded", message: e.message, cause };
    }
  }
}
