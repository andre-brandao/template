import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { Todo } from "@template/core/todo";
import { Examples } from "@template/core/examples";

const { test, validateOpenAPIRoute } = setupApiTest();

describe("todo", () => {
  test("GET /todo", async () => {
    const response = await validateOpenAPIRoute("get", "/todo");
    expect(response.data).toBeArray();
  });

  test("POST /todo", async () => {
    const response = await validateOpenAPIRoute("post", "/todo", undefined, {
      title: Examples.Todo.title,
    });
    const created = await Todo.fromID(response.id);
    expect(created).toBeDefined();
    expect(created!.title).toBe(Examples.Todo.title);
    expect(created!.state).toBe("open");
  });

  test("GET /todo/:id", async () => {
    const id = await Todo.create({ title: "Fetch me" });
    const response = await validateOpenAPIRoute("get", "/todo/:id", { id });
    expect(response.id).toBe(id);
  });

  test("PATCH /todo/:id", async () => {
    const id = await Todo.create({ title: "Mark done" });
    const response = await validateOpenAPIRoute("patch", "/todo/:id", { id }, { state: "closed" });
    expect(response.state).toBe("closed");
  });

  test("DELETE /todo/:id", async () => {
    const id = await Todo.create({ title: "Temporary" });
    await validateOpenAPIRoute("delete", "/todo/:id", { id });
    const deleted = await Todo.fromID(id);
    expect(deleted).toBeNull();
  });
});
