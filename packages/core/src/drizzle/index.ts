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
  // Record<string, never>,

  export type TxOrDb = Transaction | PostgresJsDatabase;

  const TransactionContext = Context.create<{
    tx: TxOrDb;
    effects: (() => void | Promise<void>)[];
  }>();

  const DatabaseContext = Context.create<{ db: PostgresJsDatabase }>();
  let cachedDb: PostgresJsDatabase | undefined;
  const providedByUrl = new Map<string, PostgresJsDatabase>();

  function createDb(url: string): PostgresJsDatabase {
    const client = pg(url, { connect_timeout: 10, prepare: false, max: 1, idle_timeout: 20 });
    return drizzle({
      client,
      logger:
        process.env.DRIZZLE_LOG === "true"
          ? {
              logQuery(query, params) {
                log.info("query", { query });
                log.info("params", { params });
              },
            }
          : undefined,
    });
  }

  function client(): PostgresJsDatabase {
    try {
      return DatabaseContext.use().db;
    } catch (err) {
      if (!(err instanceof Context.NotFound)) {
        throw err;
      }

      log.warn("no database context, falling back to env");
      if (process.env.NODE_ENV === "test") {
        cachedDb ??= createDb(process.env.DATABASE_URL ?? DEFAULT_URL);
        return cachedDb;
      }
      return createDb(process.env.DATABASE_URL ?? DEFAULT_URL);
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
    // return callback(getDatabase());
    const db = client();
    const effects: (() => void | Promise<void>)[] = [];
    const result = await TransactionContext.provide({ tx: db, effects }, () => callback(db));
    await Promise.all(effects.map((effect) => effect()));
    return result;
  }

  /** Reuses one client per url — dev backends like pglite only accept a single active connection. */
  export function provide<T>(url: string, fn: () => T): T {
    let db = providedByUrl.get(url);
    if (!db) {
      db = createDb(url);
      providedByUrl.set(url, db);
    }
    return DatabaseContext.provide({ db }, fn);
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
    const result = await client().transaction(
      async (tx) => TransactionContext.provide({ tx, effects }, () => callback(tx)),
      config,
    );
    await Promise.all(effects.map((effect) => effect()));
    return result as T;
  }

  export function fn<Input, T>(callback: (input: Input, trx: TxOrDb) => Promise<T>) {
    return (input: Input) => use(async (tx) => callback(input, tx));
  }

  export async function healthcheck(): Promise<{ status: "ok" | "degraded"; message: string }> {
    try {
      await Database.use((tx) => tx.execute(sql`SELECT 1`));
      return { status: "ok", message: "ok" };
    } catch (err) {
      log.error(err instanceof Error ? err : new Error(String(err)));
      return {
        status: "degraded",
        message: err instanceof Error ? err.message : "unreachable",
      };
    }
  }
}
