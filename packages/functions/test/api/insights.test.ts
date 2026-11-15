import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { Todo } from "@template/core/todo";
import { Identifier } from "@template/core/identifier";

const { test, validateOpenAPIRoute, get } = setupApiTest();

const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

describe("insights", () => {
  // Scoped to a project of their own, so other tests' todos don't shift the counts.
  const scope = { source: "project", sourceID: Identifier.create("project") };
  const range = { start: day(-30), end: day(1), ...scope };

  test("GET /insights/stats", async () => {
    await Todo.create({ title: "Counted", status: "active", ...scope });
    const response = await validateOpenAPIRoute("get", "/insights/stats", range);
    expect(response.active).toBe(1);
    // No body to break, so the declared 400 is driven by a backwards range.
    const bad = new URLSearchParams({ start: day(1), end: day(-1) });
    expect((await get(`/insights/stats?${bad}`)).status).toBe(400);
  });

  test("GET /insights/status", async () => {
    const response = await validateOpenAPIRoute("get", "/insights/status", range);
    expect(response.rows.map((row: { status: string }) => row.status)).toContain("done");
  });

  test("GET /insights/load", async () => {
    const response = await validateOpenAPIRoute("get", "/insights/load", range);
    expect(response.rows).toBeArray();
  });

  test("GET /insights/due", async () => {
    const { id } = await Todo.create({
      title: "Due soon",
      dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      ...scope,
    });
    const response = await validateOpenAPIRoute("get", "/insights/due", scope);
    expect(response.map((todo: { id: string }) => todo.id)).toContain(id);
  });

  test("GET /insights/calendar", async () => {
    const response = await validateOpenAPIRoute("get", "/insights/calendar", range);
    expect(response.total).toBeGreaterThanOrEqual(1);
  });

  test("GET /insights/activity", async () => {
    const response = await validateOpenAPIRoute("get", "/insights/activity", range);
    expect(response.series).toBeArray();
  });
});
