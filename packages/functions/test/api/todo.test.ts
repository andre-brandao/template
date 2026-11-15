import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { Todo } from "@template/core/todo";
import { Identifier } from "@template/core/identifier";
import { Examples } from "@template/core/examples";

const { test, validateOpenAPIRoute, del } = setupApiTest();

describe("todo", () => {
  test("GET /todo", async () => {
    const response = await validateOpenAPIRoute("get", "/todo");
    expect(response.data).toBeArray();
  });

  test("GET /todo?from&to", async () => {
    const scope = { source: "project", sourceID: Identifier.create("project") };
    const span = await Todo.create({
      title: "Spans the window",
      startDate: "2026-05-20T00:00:00.000Z",
      dueDate: "2026-07-10T00:00:00.000Z",
      ...scope,
    });
    const due = await Todo.create({
      title: "Due inside",
      dueDate: "2026-06-15T12:00:00.000Z",
      ...scope,
    });
    await Todo.create({ title: "Due after", dueDate: "2026-07-02T00:00:00.000Z", ...scope });
    const undated = await Todo.create({ title: "Undated", ...scope });
    const range = {
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-30T23:59:59.999Z",
      ...scope,
    };
    const response = await validateOpenAPIRoute("get", "/todo", range);
    const ids = response.data.map((todo: { id: string }) => todo.id).sort();
    expect(ids).toEqual([span.id, due.id].sort());
    const loose = await validateOpenAPIRoute("get", "/todo", { unscheduled: "true", ...scope });
    expect(loose.data.map((todo: { id: string }) => todo.id)).toEqual([undated.id]);
  });

  test("GET /todo/stage", async () => {
    const response = await validateOpenAPIRoute("get", "/todo/stage");
    expect(response).toBeArray();
  });

  test("PATCH /todo/stage", async () => {
    const scope = { source: "project", sourceID: Identifier.create("project") };
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
