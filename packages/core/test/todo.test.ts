import { describe, expect } from "bun:test";
import { Todo } from "../src/todo";
import { withTestUser } from "./util";

describe("todo", () => {
  withTestUser("create and fetch a todo", async ({ userID }) => {
    const id = await Todo.create({ title: "Write the report" });
    const todo = await Todo.fromID(id);
    expect(todo?.title).toBe("Write the report");
    expect(todo?.state).toBe("open");
    expect(todo?.stateReason).toBeNull();
    expect(todo?.userID).toBe(userID);
  });

  withTestUser("list only returns todos for the current user", async () => {
    await Todo.create({ title: "First" });
    await Todo.create({ title: "Second" });
    const page = await Todo.list({});
    expect(page.data).toHaveLength(2);
    expect(page.total).toBe(2);
  });

  withTestUser("list can filter by state", async () => {
    const id = await Todo.create({ title: "Done later" });
    await Todo.update({ id, state: "closed" });
    const closed = await Todo.list({ state: "closed" });
    const open = await Todo.list({ state: "open" });
    expect(closed.data.map((t) => t.id)).toContain(id);
    expect(open.data.map((t) => t.id)).not.toContain(id);
  });

  withTestUser("closing defaults the reason and reopening clears it", async () => {
    const id = await Todo.create({ title: "Waiting on review" });
    await Todo.update({ id, state: "closed" });
    expect((await Todo.fromID(id))?.stateReason).toBe("completed");

    await Todo.update({ id, state: "closed", stateReason: "not_planned" });
    expect((await Todo.fromID(id))?.stateReason).toBe("not_planned");

    await Todo.update({ id, state: "open" });
    expect((await Todo.fromID(id))?.stateReason).toBeNull();
  });

  withTestUser("tags are trimmed and deduped", async () => {
    const id = await Todo.create({ title: "Tagged", tags: [" work ", "urgent", "urgent"] });
    expect((await Todo.fromID(id))?.tags).toEqual(["work", "urgent"]);
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
