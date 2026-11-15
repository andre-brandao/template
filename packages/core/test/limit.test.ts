import { describe, expect, it } from "bun:test";
import { Kv } from "../src/lib/kv";
import { Limit } from "../src/lib/limit";

describe("rate limit", () => {
  const rules = Limit.catalog({
    auth: {
      login: {
        algorithm: Limit.fixedWindow,
        options: { limit: 2, window: 60 },
      },
    },
  });

  it("builds a typed catalog and rejects after the configured limit", async () => {
    const subject = Limit.subject("email", "ada@example.com");

    await Kv.provide(Kv.fake(), async () => {
      expect((await rules.auth.login.consume(subject)).remaining).toBe(1);
      expect((await rules.auth.login.consume(subject)).remaining).toBe(0);
      await expect(rules.auth.login.consume(subject)).rejects.toMatchObject({
        type: "rate_limit",
        code: "rate_limit_exceeded",
        retryAfter: expect.any(Number),
      });
    });
  });

  it("inspects and resets a subject without running protected work", async () => {
    const subject = Limit.subject("user", "usr_123");

    await Kv.provide(Kv.fake(), async () => {
      await rules.auth.login.consume(subject);
      expect((await rules.auth.login.inspect(subject)).remaining).toBe(1);

      await rules.auth.login.reset(subject);
      expect((await rules.auth.login.inspect(subject)).remaining).toBe(2);
    });
  });

  it("accepts a custom algorithm in the same catalog", async () => {
    const custom: Limit.Algorithm<{ limit: number }> = {
      async consume(_store, _key, opts) {
        return { allowed: true, limit: opts.limit, remaining: opts.limit, resetAfter: 0 };
      },
      async inspect(_store, _key, opts) {
        return { allowed: true, limit: opts.limit, remaining: opts.limit, resetAfter: 0 };
      },
      async reset() {},
    };
    const catalog = Limit.catalog({ custom: { algorithm: custom, options: { limit: 3 } } });

    await Kv.provide(Kv.fake(), async () => {
      expect((await catalog.custom.consume(Limit.subject("test", "one"))).limit).toBe(3);
    });
  });
});
