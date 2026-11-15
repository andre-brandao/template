import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { Todo } from "@template/core/todo";
import { Examples } from "@template/core/examples";

const { test, validateOpenAPIRoute, get, del } = setupApiTest();

const day = (offset: number) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

describe("todo", () => {
  test("GET /todo", async () => {
    const response = await validateOpenAPIRoute("get", "/todo");
    expect(response.data).toBeArray();
  });

  test("GET /todo/stage", async () => {
    const response = await validateOpenAPIRoute("get", "/todo/stage");
    expect(response).toBeArray();
  });

  test("PATCH /todo/stage", async () => {
    const scope = { source: "project", sourceID: `stage-${crypto.randomUUID()}` };
    const { id } = await Todo.create({ title: "Staged", stage: "Draft", ...scope });
    await validateOpenAPIRoute("patch", "/todo/stage", undefined, {
      from: "Draft",
      to: "Review",
      ...scope,
    });
    expect((await Todo.fromID(id))!.stage).toBe("Review");
  });

  test("POST /todo", async () => {
    const response = await validateOpenAPIRoute("post", "/todo", undefined, {
      title: Examples.Todo.title,
    });
    const created = await Todo.fromID(response.id);
    expect(created).toBeDefined();
    expect(created!.title).toBe(Examples.Todo.title);
    expect(created!.status).toBe("backlog");
  });

  test("GET /todo/:id", async () => {
    const { id } = await Todo.create({ title: "Fetch me" });
    const response = await validateOpenAPIRoute("get", "/todo/:id", { id });
    expect(response.id).toBe(id);
  });

  test("PATCH /todo/:id", async () => {
    const { id } = await Todo.create({ title: "Mark done" });
    const response = await validateOpenAPIRoute("patch", "/todo/:id", { id }, { status: "active" });
    expect(response.status).toBe("active");
    expect(response.timeStarted).not.toBeNull();
  });

  test("POST /todo/:id/link", async () => {
    const { id } = await Todo.create({ title: "Linked" });
    const response = await validateOpenAPIRoute(
      "post",
      "/todo/:id/link",
      { id },
      { url: "https://example.com", title: "Example" },
    );
    expect(response.metadata.links).toEqual([{ url: "https://example.com", title: "Example" }]);
  });

  test("DELETE /todo/:id/link", async () => {
    const { id } = await Todo.create({ title: "Unlinked" });
    await Todo.link({ id, url: "https://example.com" });
    const response = await validateOpenAPIRoute("delete", "/todo/:id/link", {
      id,
      url: "https://example.com",
    });
    expect(response.metadata.links).toEqual([]);
    // No body to break, so the declared 400 is driven by a missing `url`.
    expect((await del(`/todo/${id}/link`)).status).toBe(400);
  });

  test("DELETE /todo/:id", async () => {
    const { id } = await Todo.create({ title: "Temporary" });
    await validateOpenAPIRoute("delete", "/todo/:id", { id });
    const deleted = await Todo.fromID(id);
    expect(deleted).toBeNull();
  });
});

describe("insights", () => {
  // Scoped to a project of their own, so other tests' todos don't shift the counts.
  const scope = { source: "project", sourceID: `insights-${crypto.randomUUID()}` };
  const range = { start: day(-30), end: day(1), ...scope };

  test("GET /todo/insights/stats", async () => {
    await Todo.create({ title: "Counted", status: "active", ...scope });
    const response = await validateOpenAPIRoute("get", "/todo/insights/stats", range);
    expect(response.active).toBe(1);
    // No body to break, so the declared 400 is driven by a backwards range.
    const bad = new URLSearchParams({ start: day(1), end: day(-1) });
    expect((await get(`/todo/insights/stats?${bad}`)).status).toBe(400);
  });

  test("GET /todo/insights/status", async () => {
    const response = await validateOpenAPIRoute("get", "/todo/insights/status", range);
    expect(response.rows.map((row: { status: string }) => row.status)).toContain("done");
  });

  test("GET /todo/insights/load", async () => {
    const response = await validateOpenAPIRoute("get", "/todo/insights/load", range);
    expect(response.rows).toBeArray();
  });

  test("GET /todo/insights/due", async () => {
    const { id } = await Todo.create({
      title: "Due soon",
      dueDate: new Date(Date.now() + 86_400_000).toISOString(),
      ...scope,
    });
    const response = await validateOpenAPIRoute("get", "/todo/insights/due", scope);
    expect(response.map((todo: { id: string }) => todo.id)).toContain(id);
  });

  test("GET /todo/insights/calendar", async () => {
    const response = await validateOpenAPIRoute("get", "/todo/insights/calendar", range);
    expect(response.total).toBeGreaterThanOrEqual(1);
  });

  test("GET /todo/insights/activity", async () => {
    const response = await validateOpenAPIRoute("get", "/todo/insights/activity", range);
    expect(response.series).toBeArray();
  });
});
