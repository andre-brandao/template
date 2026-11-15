import { Hono } from "hono";
import { validator, authRequired } from "../common";
import { describe } from "../doc";
import { Insights } from "@template/core/todo";

export namespace InsightsApi {
  const doc = describe("Insights");

  export const route = new Hono()
    .get(
      "/stats",
      doc(Insights.stats.meta, {
        200: doc.json(Insights.Stats),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", Insights.Range),
      async (c) => c.json(await Insights.stats(c.req.valid("query")), 200),
    )
    .get(
      "/status",
      doc(Insights.status.meta, {
        200: doc.json(Insights.Statuses),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", Insights.Range),
      async (c) => c.json(await Insights.status(c.req.valid("query")), 200),
    )
    .get(
      "/load",
      doc(Insights.load.meta, {
        200: doc.json(Insights.Load),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", Insights.Range),
      async (c) => c.json(await Insights.load(c.req.valid("query")), 200),
    )
    .get(
      "/due",
      doc(Insights.due.meta, {
        200: doc.list(Insights.Due),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", Insights.Scope),
      async (c) => c.json(await Insights.due(c.req.valid("query")), 200),
    )
    .get(
      "/calendar",
      doc(Insights.calendar.meta, {
        200: doc.json(Insights.Calendar),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", Insights.Range),
      async (c) => c.json(await Insights.calendar(c.req.valid("query")), 200),
    )
    .get(
      "/activity",
      doc(Insights.activity.meta, {
        200: doc.json(Insights.Activity),
        ...doc.errors(400, 401, 403, 500),
      }),
      authRequired,
      validator("query", Insights.Range),
      async (c) => c.json(await Insights.activity(c.req.valid("query")), 200),
    );
}
