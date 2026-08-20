import { describe, expect, it } from "bun:test";
import { app } from "../src/api/routes";
import { app as mcp } from "../src/mcp";

/** Every service mounts the same probe app, so one pass over each proves the wiring. */
const apps = { api: app, mcp };

describe("probes", () => {
  for (const [name, app] of Object.entries(apps)) {
    it(`${name} answers liveness without a token`, async () => {
      const res = await app.request("/healthz");
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ status: "ok" });
    });

    it(`${name} reports the database on readiness`, async () => {
      const res = await app.request("/readyz");
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ status: "ok", checks: { db: { status: "ok" } } });
    });

    it(`${name} answers startup`, async () => {
      const res = await app.request("/startupz");
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ status: "ok" });
    });
  }
});
