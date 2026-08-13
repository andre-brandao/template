import { describe, expect, it } from "bun:test";
import type { RequestEvent } from "@sveltejs/kit";
import { clear, read, seal, write } from "../src/lib/server/session";

process.env.SESSION_SECRET = "test-secret";

const SESSION = { userID: "usr_01ABC", email: "someone@example.com" };

/** Just enough of `event.cookies` for the four exported functions, plus a record of writes. */
function event(cookie?: string) {
  const jar = new Map(cookie === undefined ? [] : [["auth", cookie]]);
  const opts: unknown[] = [];
  const deleted: string[] = [];
  return {
    jar,
    opts,
    deleted,
    cookies: {
      get: (name: string) => jar.get(name),
      set: (name: string, v: string, o: unknown) => {
        jar.set(name, v);
        opts.push(o);
      },
      delete: (name: string) => {
        jar.delete(name);
        deleted.push(name);
      },
    },
  };
}

const as = (e: ReturnType<typeof event>) => e as any as RequestEvent;

describe("seal", () => {
  it("produces a url-safe payload.signature pair", async () => {
    const cookie = await seal(SESSION);
    expect(cookie.split(".")).toHaveLength(2);
    expect(cookie).not.toMatch(/[+/=]/);
  });

  it("is deterministic for the same session and secret", async () => {
    expect(await seal(SESSION)).toBe(await seal(SESSION));
  });

  it("throws when SESSION_SECRET is unset", async () => {
    delete process.env.SESSION_SECRET;
    await expect(seal(SESSION)).rejects.toThrow("SESSION_SECRET is not set");
    process.env.SESSION_SECRET = "test-secret";
  });
});

describe("read", () => {
  it("round-trips a sealed session", async () => {
    const e = event(await seal(SESSION));
    expect(await read(as(e))).toEqual(SESSION);
    expect(e.deleted).toBeEmpty();
  });

  // encode() walks UTF-8 bytes through btoa, so anything non-ASCII exercises that path.
  it("round-trips non-ascii values", async () => {
    const session = { userID: "usr_01ABC", email: "andré+ção@example.com" };
    expect(await read(as(event(await seal(session))))).toEqual(session);
  });

  it("returns null without a cookie and leaves the jar alone", async () => {
    const e = event();
    expect(await read(as(e))).toBeNull();
    expect(e.deleted).toBeEmpty();
  });

  it("rejects a tampered payload and clears the cookie", async () => {
    const [, sig] = (await seal(SESSION)).split(".");
    const forged = `${btoa(JSON.stringify({ userID: "usr_evil", email: "evil@example.com" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")}.${sig}`;
    const e = event(forged);
    expect(await read(as(e))).toBeNull();
    expect(e.deleted).toEqual(["auth"]);
  });

  it("rejects a tampered signature", async () => {
    const [payload, sig] = (await seal(SESSION)).split(".");
    const flipped = sig!.slice(0, -1) + (sig!.at(-1) === "A" ? "B" : "A");
    expect(await read(as(event(`${payload}.${flipped}`)))).toBeNull();
  });

  it("rejects a cookie sealed with a different secret", async () => {
    const cookie = await seal(SESSION);
    process.env.SESSION_SECRET = "rotated-secret";
    expect(await read(as(event(cookie)))).toBeNull();
    process.env.SESSION_SECRET = "test-secret";
  });

  it("rejects malformed cookies without throwing", async () => {
    for (const raw of ["", "nodot", ".", "a.", ".b", "a.b", "%%%.%%%"]) {
      expect(await read(as(event(raw)))).toBeNull();
    }
  });
});

describe("write and clear", () => {
  it("stores a cookie that reads back", async () => {
    const e = event();
    await write(as(e), SESSION);
    expect(await read(as(e))).toEqual(SESSION);
  });

  it("sets the hardening options, with secure off outside production", async () => {
    const e = event();
    await write(as(e), SESSION);
    expect(e.opts[0]).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  });

  it("clear drops the cookie", async () => {
    const e = event(await seal(SESSION));
    clear(as(e));
    expect(e.deleted).toEqual(["auth"]);
    expect(await read(as(e))).toBeNull();
  });
});
