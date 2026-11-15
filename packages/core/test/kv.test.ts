import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { Database } from "../src/drizzle";
import { Kv } from "../src/lib/kv";
import { file } from "../src/lib/kv/adapter/file";
import { memory } from "../src/lib/kv/adapter/memory";
import { pg } from "../src/lib/kv/adapter/pg";
import { redis } from "../src/lib/kv/adapter/redis";

const wait = (ms: number) => new Promise((wake) => setTimeout(wake, ms));

/** Every driver has to behave the same, so one suite runs against each. */
const drivers: Record<string, () => Kv.Store> = {
  memory: () => memory(),
  file: () => file({ dir: join(tmpdir(), `template-kv-${crypto.randomUUID()}`) }),
  pg: () => pg({ use: Database.use }),
};
if (process.env.REDIS_URL) drivers.redis = () => redis({ url: process.env.REDIS_URL });

for (const [name, make] of Object.entries(drivers)) {
  describe(`kv: ${name}`, () => {
    // Keys are unique per test so pg and redis runs never see each other's rows.
    const key = (k: string) => `${name}:${crypto.randomUUID()}:${k}`;

    it("gets, sets and deletes", async () => {
      const store = make();
      const k = key("a");
      expect(await store.get(k)).toBeNull();
      await store.set(k, "one");
      expect(await store.get(k)).toBe("one");
      await store.set(k, "two");
      expect(await store.get(k)).toBe("two");
      await store.delete(k);
      expect(await store.get(k)).toBeNull();
      await store.delete(k);
    });

    it("expires a value after its ttl", async () => {
      const store = make();
      const k = key("ttl");
      await store.set(k, "v", { ttl: 1 });
      expect(await store.get(k)).toBe("v");
      await wait(1100);
      expect(await store.get(k)).toBeNull();
    });

    it("incr counts atomically from zero", async () => {
      const store = make();
      const k = key("n");
      expect(await store.incr(k)).toBe(1);
      expect(await store.incr(k, 5)).toBe(6);
      // File is read-modify-write, so only the transactional drivers race safely.
      if (name === "file") return;
      const all = await Promise.all(Array.from({ length: 10 }, () => store.incr(k)));
      expect(Math.max(...all)).toBe(16);
      expect(new Set(all).size).toBe(10);
    });

    it("incr applies the ttl only when it creates the key", async () => {
      const store = make();
      const k = key("rate");
      expect(await store.incr(k, 1, { ttl: 1 })).toBe(1);
      await wait(600);
      // A later ttl must not push the window out.
      expect(await store.incr(k, 1, { ttl: 60 })).toBe(2);
      await wait(600);
      expect(await store.get(k)).toBeNull();
      expect(await store.incr(k, 1, { ttl: 60 })).toBe(1);
    });

    it("lists keys under a prefix, skipping expired ones", async () => {
      const store = make();
      const base = key("list");
      await store.set(`${base}:a`, "1");
      await store.set(`${base}:b/c`, "2");
      await store.set(`${base}:gone`, "3", { ttl: 1 });
      await store.set(`${base}_x`, "4");
      await wait(1100);
      expect((await store.keys(`${base}:`)).sort()).toEqual([`${base}:a`, `${base}:b/c`]);
    });

    it("escapes like wildcards in the prefix", async () => {
      const store = make();
      const base = key("esc");
      await store.set(`${base}%_`, "1");
      await store.set(`${base}ab`, "2");
      expect(await store.keys(`${base}%_`)).toEqual([`${base}%_`]);
    });

    it("json helpers round-trip and reject bad shapes", async () => {
      await Kv.provide(make(), async () => {
        const schema = z.object({ hits: z.number() });
        const k = key("json");
        await Kv.use().json.set(k, { hits: 1 }, { ttl: 60 });
        expect(await Kv.use().json.get(k, schema)).toEqual({ hits: 1 });
        await Kv.use().set(k, "not json");
        expect(await Kv.use().json.get(k, schema)).toBeNull();
        await Kv.use().json.set(k, { hits: "x" });
        expect(await Kv.use().json.get(k, schema)).toBeNull();
        expect(await Kv.use().json.get(key("missing"), schema)).toBeNull();
      });
    });

    it("remember computes once and serves the cache after", async () => {
      await Kv.provide(make(), async () => {
        const k = key("models");
        const calls: number[] = [];
        const fn = () => {
          calls.push(1);
          return ["a", "b"];
        };
        expect(await Kv.use().remember(k, { ttl: 60 }, fn)).toEqual(["a", "b"]);
        expect(await Kv.use().remember(k, { ttl: 60 }, fn)).toEqual(["a", "b"]);
        expect(calls).toHaveLength(1);
      });
    });
  });
}

describe("kv: file", () => {
  it("keeps traversal keys inside its directory", async () => {
    const dir = join(tmpdir(), `template-kv-${crypto.randomUUID()}`);
    const store = file({ dir });
    await store.set("../../escape", "x");
    expect(await store.get("../../escape")).toBe("x");
    expect(existsSync(join(dir, "..", "..", "escape.json"))).toBe(false);
    expect(await store.keys("../")).toEqual(["../../escape"]);
  });
});

describe("kv: fromEnv", () => {
  it("picks the driver from KV_DRIVER", () => {
    expect(Kv.fromEnv({ KV_DRIVER: "memory" }).get).toBeFunction();
    expect(Kv.fromEnv({ KV_DRIVER: "file", KV_DIR: tmpdir() }).get).toBeFunction();
    expect(Kv.fromEnv({}, Database.use).get).toBeFunction();
    expect(() => Kv.fromEnv({})).toThrow("needs a database runner");
    expect(() => Kv.fromEnv({ KV_DRIVER: "redis" })).toThrow("Unknown KV_DRIVER");
    expect(
      Kv.fromEnv({ KV_DRIVER: "redis" }, undefined, { redis: () => memory() }).get,
    ).toBeFunction();
  });
});
