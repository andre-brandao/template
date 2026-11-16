import { Database } from "./drizzle";

/**
 * Which schema tenant tables resolve to. `Database` sets the transaction's search_path from it;
 * `central` tables are schema-qualified, so they read the same from every workspace.
 */
export namespace Workspace {
  // Plain text in SQL, no PG enum; the union only guards writes and narrows reads.
  export const roles = ["owner", "admin", "member"] as const;
  export type Role = (typeof roles)[number];

  export type Info = { schema: string; role?: Role };

  /** Throws unless `schema` is `public` or a `ws_*` name — it is interpolated into DDL. */
  export function valid(schema: string) {
    if (schema === "public" || /^ws_[a-z0-9_]{1,40}$/.test(schema)) return schema;
    throw new Error(`Invalid workspace schema: ${schema}`);
  }

  /** Runs `fn` in `info`'s schema. Opened before any transaction, which keeps its own path. */
  export function provide<R>(info: Info, fn: () => R): R {
    valid(info.schema);
    if (Database.open()) throw new Error("Workspace.provide inside an open transaction");
    return Database.Tenant.provide(info, fn);
  }

  export function peek() {
    return Database.Tenant.peek();
  }

  /** `WORKSPACES=multi` gives each workspace its own schema; `single` (default) shares one. */
  export function mode() {
    return process.env.WORKSPACES === "multi" ? "multi" : "single";
  }

  /** The one workspace of a single-workspace app: `WORKSPACE_SCHEMA` › `public`. */
  export function single(): Info {
    return { schema: valid(process.env.WORKSPACE_SCHEMA ?? "public") };
  }
}
