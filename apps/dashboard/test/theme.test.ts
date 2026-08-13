import { describe, expect, it } from "bun:test";
import type { RequestEvent } from "@sveltejs/kit";
import { read, write } from "../src/lib/server/theme";

/** Just enough of `event.cookies`, plus a record of writes. */
function event(cookie?: string) {
  const jar = new Map(cookie === undefined ? [] : [["theme", cookie]]);
  const opts: unknown[] = [];
  return {
    opts,
    cookies: {
      get: (name: string) => jar.get(name),
      set: (name: string, v: string, o: unknown) => {
        jar.set(name, v);
        opts.push(o);
      },
      delete: (name: string) => jar.delete(name),
    },
  };
}

const as = (e: ReturnType<typeof event>) => e as any as RequestEvent;

describe("read", () => {
  it("returns the saved theme", () => {
    expect(read(as(event("dark")))).toBe("dark");
    expect(read(as(event("light")))).toBe("light");
  });

  it("falls back to system for an absent or tampered cookie", () => {
    expect(read(as(event()))).toBe("system");
    expect(read(as(event("")))).toBe("system");
    expect(read(as(event("neon")))).toBe("system");
  });
});

describe("write", () => {
  it("stores a theme that reads back", () => {
    const e = event();
    write(as(e), "dark");
    expect(read(as(e))).toBe("dark");
  });

  it("sets a year-long httpOnly cookie, insecure outside production", () => {
    const e = event();
    write(as(e), "dark");
    expect(e.opts[0]).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  // Re-setting an unchanged cookie would send a pointless Set-Cookie on every request.
  it("skips the write when the theme already matches", () => {
    const e = event("dark");
    write(as(e), "dark");
    expect(e.opts).toBeEmpty();
  });

  it("writes when an absent cookie is set to system", () => {
    const e = event("dark");
    write(as(e), "system");
    expect(read(as(e))).toBe("system");
    expect(e.opts).toHaveLength(1);
  });
});
