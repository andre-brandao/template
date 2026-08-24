import { Hono } from "hono";
import { Health } from "@template/core/health";

/** Mounted ahead of logging and auth, so probes stay unauthenticated and out of the logs. */
export const health = new Hono()
  .get("/healthz", (c) => c.json(Health.live()))
  .get("/readyz", async (c) => {
    const probe = await Health.ready();
    return c.json(probe, Health.code(probe));
  })
  .get("/startupz", async (c) => {
    const probe = await Health.start();
    return c.json(probe, Health.code(probe));
  });
