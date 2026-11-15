import { RedisClient } from "bun";
import type { Store } from "../port";

/**
 * Redis via Bun's built-in client. Bun targets only: kept out of `Kv.Providers` so a Worker
 * bundle never reaches `"bun"`; import it as `@template/core/kv/adapter/redis`.
 */
export function redis(opts: { url?: string } = {}): Store {
  // No url falls back to Bun's own REDIS_URL default.
  const client = new RedisClient(opts.url);

  return {
    get: (key) => client.get(key),
    async set(key, value, opts) {
      if (opts?.ttl === undefined) return void (await client.set(key, value));
      await client.set(key, value, "EX", opts.ttl);
    },
    async delete(key) {
      await client.del(key);
    },
    async incr(key, by = 1, opts) {
      const next = await client.incrby(key, by);
      // NX: only a key with no ttl yet (just created) gets one.
      if (opts?.ttl !== undefined) await client.send("EXPIRE", [key, String(opts.ttl), "NX"]);
      return next;
    },
    async keys(prefix) {
      const match = `${prefix.replace(/[\\*?[\]]/g, "\\$&")}*`;
      const found: string[] = [];
      let cursor = "0";
      do {
        const page = await client.scan(cursor, "MATCH", match, "COUNT", 100);
        cursor = page[0];
        found.push(...page[1]);
      } while (cursor !== "0");
      return [...new Set(found)];
    },
  };
}
