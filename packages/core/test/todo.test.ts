import { describe, expect } from "bun:test";
import { Todo } from "../src/todo";
import { withTestUser } from "./util";

describe("todo", () => {
  withTestUser("create and fetch a todo", async ({ userID }) => {
    const id = await Todo.create({ title: "Write the report" });
    const todo = await Todo.fromID(id);
    expect(todo?.title).toBe("Write the report");
    expect(todo?.status).toBe("pending");
    expect(todo?.userID).toBe(userID);
  });

  withTestUser("list only returns todos for the current user", async () => {
    await Todo.create({ title: "First" });
    await Todo.create({ title: "Second" });
    const page = await Todo.list({});
    expect(page.data).toHaveLength(2);
    expect(page.total).toBe(2);
  });

  withTestUser("list can filter by multiple statuses", async () => {
    const id = await Todo.create({ title: "Done later" });
    await Todo.update({ id, status: "done" });
    const done = await Todo.list({ status: ["done", "blocked"] });
    const pending = await Todo.list({ status: ["pending"] });
    expect(done.data.map((t) => t.id)).toContain(id);
    expect(pending.data.map((t) => t.id)).not.toContain(id);
  });

  withTestUser("statuses returns defaults plus distinct custom statuses", async () => {
    const id = await Todo.create({ title: "Waiting on review", status: "blocked" });
    await Todo.create({ title: "Fresh" });
    expect(await Todo.statuses()).toEqual(["pending", "in_progress", "done", "blocked"]);
    const blocked = await Todo.list({ status: ["blocked"] });
    expect(blocked.data.map((t) => t.id)).toContain(id);
  });

  withTestUser("list paginates results", async () => {
    for (let i = 0; i < 3; i++) await Todo.create({ title: `Todo ${i}` });
    const firstPage = await Todo.list({ page: 1, pageSize: 2 });
    const secondPage = await Todo.list({ page: 2, pageSize: 2 });
    expect(firstPage.data).toHaveLength(2);
    expect(secondPage.data).toHaveLength(1);
    expect(firstPage.total).toBe(3);
  });

  withTestUser("remove soft-deletes the todo", async () => {
    const id = await Todo.create({ title: "Temporary" });
    await Todo.remove(id);
    const todo = await Todo.fromID(id);
    expect(todo).toBeNull();
  });
});
