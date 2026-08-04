import { describe, expect } from "bun:test";
import { Todo } from "../src/todo";
import { Identifier } from "../src/identifier";
import { withTestUser } from "./util";

// Todos are visible to everyone, so tests that count rows scope themselves to a
// throwaway source instead of relying on the actor.
const project = () => ({ source: "project", sourceID: Identifier.create("project") });

describe("todo", () => {
  withTestUser("create and fetch a todo", async ({ userID }) => {
    const id = await Todo.create({ title: "Write the report" });
    const todo = await Todo.fromID(id);
    expect(todo?.title).toBe("Write the report");
    expect(todo?.status).toBe("backlog");
    expect(todo?.reason).toBeNull();
    expect(todo?.createdBy).toBe(userID);
    expect(todo?.assignee).toBeNull();
    expect(todo?.timeStarted).toBeNull();
  });

  withTestUser("list scopes to the owning entity", async () => {
    const src = project();
    await Todo.create({ title: "First", ...src });
    await Todo.create({ title: "Second", ...src });
    await Todo.create({ title: "Elsewhere", ...project() });
    const page = await Todo.list(src);
    expect(page.data.map((todo) => todo.title).sort()).toEqual(["First", "Second"]);
    expect(page.total).toBe(2);
  });

  withTestUser("list filters by status, assignee and stage", async ({ userID }) => {
    const src = project();
    const mine = await Todo.create({ title: "Mine", assignee: userID, stage: "Sprint 1", ...src });
    await Todo.create({ title: "Nobody's", ...src });
    await Todo.update({ id: mine, status: "active" });

    expect((await Todo.list({ ...src, status: "active" })).data.map((t) => t.id)).toEqual([mine]);
    expect((await Todo.list({ ...src, assignee: userID })).data.map((t) => t.id)).toEqual([mine]);
    expect((await Todo.list({ ...src, assignee: "none" })).data).toHaveLength(1);
    expect((await Todo.list({ ...src, stage: "Sprint 1" })).data.map((t) => t.id)).toEqual([mine]);
    expect((await Todo.list({ ...src, stage: "none" })).data).toHaveLength(1);
  });

  withTestUser("starting stamps the actual start, finishing stamps the end", async () => {
    const id = await Todo.create({ title: "Do the thing" });

    await Todo.update({ id, status: "active" });
    const started = await Todo.fromID(id);
    expect(started?.timeStarted).not.toBeNull();
    expect(started?.timeDone).toBeNull();

    // Blocking keeps the original start, so a resumed task doesn't look brand new.
    await Todo.update({ id, status: "blocked", reason: "waiting on design" });
    expect((await Todo.fromID(id))?.timeStarted).toBe(started!.timeStarted);
    expect((await Todo.fromID(id))?.reason).toBe("waiting on design");

    await Todo.update({ id, status: "active" });
    expect((await Todo.fromID(id))?.timeStarted).toBe(started!.timeStarted);
    expect((await Todo.fromID(id))?.reason).toBeNull();

    await Todo.update({ id, status: "done", reason: "completed" });
    const done = await Todo.fromID(id);
    expect(done?.timeDone).not.toBeNull();
    expect(done?.timeStarted).toBe(started!.timeStarted);
  });

  withTestUser("falling back to backlog means it never started", async () => {
    const id = await Todo.create({ title: "False start", status: "active" });
    expect((await Todo.fromID(id))?.timeStarted).not.toBeNull();

    await Todo.update({ id, status: "backlog" });
    const todo = await Todo.fromID(id);
    expect(todo?.timeStarted).toBeNull();
    expect(todo?.timeDone).toBeNull();
  });

  withTestUser("assignment joins the user back in", async ({ userID }) => {
    const id = await Todo.create({ title: "Hand it over" });
    await Todo.update({ id, assignee: userID });
    expect((await Todo.fromID(id))?.assignee).toMatchObject({ id: userID, name: "Test User" });

    await Todo.update({ id, assignee: null });
    expect((await Todo.fromID(id))?.assignee).toBeNull();
  });

  withTestUser("stages derive their span and counts from their todos", async () => {
    const src = project();
    await Todo.create({
      title: "Kickoff",
      stage: "Discovery",
      startDate: "2026-01-05T00:00:00.000Z",
      dueDate: "2026-01-09T00:00:00.000Z",
      ...src,
    });
    const late = await Todo.create({
      title: "Wrap up",
      stage: "Discovery",
      startDate: "2026-01-07T00:00:00.000Z",
      dueDate: "2026-01-20T00:00:00.000Z",
      ...src,
    });
    await Todo.create({
      title: "Build it",
      stage: "Delivery",
      startDate: "2026-02-02T00:00:00.000Z",
      dueDate: "2026-02-20T00:00:00.000Z",
      ...src,
    });
    await Todo.create({ title: "Unstaged", ...src });
    await Todo.update({ id: late, status: "done" });

    const stages = await Todo.stages(src);
    expect(stages.map((stage) => stage.name)).toEqual(["Discovery", "Delivery"]);
    expect(stages[0]).toMatchObject({
      total: 2,
      done: 1,
      start: "2026-01-05T00:00:00.000Z",
      end: "2026-01-20T00:00:00.000Z",
    });
  });

  withTestUser("renaming a stage moves every todo wearing it", async () => {
    const src = project();
    await Todo.create({ title: "One", stage: "Sprint 1", ...src });
    await Todo.create({ title: "Two", stage: "Sprint 1", ...src });
    await Todo.rename({ from: "Sprint 1", to: "Sprint 2", ...src });

    const stages = await Todo.stages(src);
    expect(stages.map((stage) => stage.name)).toEqual(["Sprint 2"]);
    expect(stages[0]?.total).toBe(2);
  });

  withTestUser("tags are trimmed and deduped", async () => {
    const id = await Todo.create({ title: "Tagged", tags: [" work ", "urgent", "urgent"] });
    expect((await Todo.fromID(id))?.tags).toEqual(["work", "urgent"]);
  });

  withTestUser("list paginates results", async () => {
    const src = project();
    for (let i = 0; i < 3; i++) await Todo.create({ title: `Todo ${i}`, ...src });
    const firstPage = await Todo.list({ ...src, page: 1, pageSize: 2 });
    const secondPage = await Todo.list({ ...src, page: 2, pageSize: 2 });
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
