import { browser } from "$app/environment";
import { getRows } from "../api/panel.remote";

/** Rows a block draws. */
const LIMIT = 5000;

export type Result = Awaited<ReturnType<typeof getRows>>;

// Per tab: the tool's run and the block's render share one fetch per SQL.
const cache = new Map<string, Promise<Result>>();

/** A block's rows, fetched once per SQL. A failure is dropped so a retry fetches again. */
export function fetchRows(sql: string) {
  // The server's module is shared by every request and user: never cache there.
  if (!browser) return Promise.resolve(getRows({ sql, limit: LIMIT }));
  const hit = cache.get(sql);
  if (hit) return hit;
  const promise = Promise.resolve(getRows({ sql, limit: LIMIT }));
  cache.set(sql, promise);
  promise.catch(() => cache.delete(sql));
  return promise;
}
