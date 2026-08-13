import { describe, expect, it } from "bun:test";
import * as config from "../src/config";

// The whole suite shares one scratch config file (see test/setup.ts), so every case
// starts from a known state instead of relying on order.
const fresh = (name: string, cb: () => Promise<void>) =>
  it(name, async () => {
    await config.clear();
    delete process.env.TEMPLATE_TOKEN;
    delete process.env.API_URL;
    delete process.env.AUTH_URL;
    await cb();
  });

describe("token", () => {
  fresh("prefers the flag over everything else", async () => {
    process.env.TEMPLATE_TOKEN = "sk-env";
    await config.write({ token: "sk-saved" });
    expect(await config.token("sk-flag")).toBe("sk-flag");
  });

  fresh("falls back to TEMPLATE_TOKEN before the saved key", async () => {
    process.env.TEMPLATE_TOKEN = "sk-env";
    await config.write({ token: "sk-saved" });
    expect(await config.token()).toBe("sk-env");
  });

  fresh("falls back to the saved key before the OAuth access token", async () => {
    await config.write({ token: "sk-saved", access: "oauth-access" });
    expect(await config.token()).toBe("sk-saved");
  });

  // No refresh token and no issuer means there is nothing to refresh against.
  fresh("returns the saved access token as-is when it cannot be refreshed", async () => {
    await config.write({ access: "oauth-access" });
    expect(await config.token()).toBe("oauth-access");

    await config.write({ access: "oauth-access", refresh: "oauth-refresh" });
    expect(await config.token()).toBe("oauth-access");
  });

  fresh("is undefined with nothing on file", async () => {
    expect(await config.token()).toBeUndefined();
  });
});

describe("url", () => {
  fresh("prefers the flag over everything else", async () => {
    process.env.API_URL = "http://env";
    await config.write({ url: "http://saved" });
    expect(await config.url("http://flag")).toBe("http://flag");
  });

  fresh("falls back to API_URL before the saved url", async () => {
    process.env.API_URL = "http://env";
    await config.write({ url: "http://saved" });
    expect(await config.url()).toBe("http://env");
  });

  fresh("falls back to the saved url before the default", async () => {
    await config.write({ url: "http://saved" });
    expect(await config.url()).toBe("http://saved");
  });

  fresh("defaults to localhost:3000", async () => {
    expect(await config.url()).toBe("http://localhost:3000");
  });
});

describe("issuer", () => {
  fresh("prefers the flag over everything else", async () => {
    process.env.AUTH_URL = "http://env";
    await config.write({ issuer: "http://saved" });
    expect(await config.issuer("http://flag")).toBe("http://flag");
  });

  fresh("falls back to AUTH_URL before the saved issuer", async () => {
    process.env.AUTH_URL = "http://env";
    await config.write({ issuer: "http://saved" });
    expect(await config.issuer()).toBe("http://env");
  });

  fresh("falls back to the saved issuer before the default", async () => {
    await config.write({ issuer: "http://saved" });
    expect(await config.issuer()).toBe("http://saved");
  });

  fresh("defaults to localhost:3002", async () => {
    expect(await config.issuer()).toBe("http://localhost:3002");
  });
});

describe("write and clear", () => {
  fresh("creates the file on first write and round-trips every field", async () => {
    await config.write({
      token: "sk-1",
      access: "a",
      refresh: "r",
      issuer: "http://i",
      url: "http://u",
    });
    expect(await config.token()).toBe("sk-1");
    expect(await config.url()).toBe("http://u");
    expect(await config.issuer()).toBe("http://i");
  });

  fresh("overwrites rather than merges", async () => {
    await config.write({ token: "sk-1", url: "http://u" });
    await config.write({ url: "http://u" });
    expect(await config.token()).toBeUndefined();
  });

  fresh("clear removes the saved values and is a no-op when already gone", async () => {
    await config.write({ token: "sk-1", url: "http://u" });
    await config.clear();
    await config.clear();
    expect(await config.token()).toBeUndefined();
    expect(await config.url()).toBe("http://localhost:3000");
  });
});
