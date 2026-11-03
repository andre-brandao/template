import { describe, expect } from "bun:test";
import { Actor } from "../src/actor";
import { Insights, Todo } from "../src/todo";
import { Identifier } from "../src/identifier";
import { withTestUser } from "./util";

// Todos are visible to everyone, so tests that count rows scope themselves to a
// throwaway source instead of relying on the actor.
const project = () => ({ source: "project", sourceID: Identifier.create("project") });

describe("todo", () => {
  withTestUser("create and fetch a todo", async ({ userID }) => {
    const { id } = await Todo.create({ title: "Write the report" });
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
    const { id: mine } = await Todo.create({
      title: "Mine",
      assignee: userID,
      stage: "Sprint 1",
      ...src,
    });
    await Todo.create({ title: "Nobody's", ...src });
    await Todo.update({ id: mine, status: "active" });

    expect((await Todo.list({ ...src, status: "active" })).data.map((t) => t.id)).toEqual([mine]);
    expect((await Todo.list({ ...src, assignee: userID })).data.map((t) => t.id)).toEqual([mine]);
    expect((await Todo.list({ ...src, assignee: "none" })).data).toHaveLength(1);
    expect((await Todo.list({ ...src, stage: "Sprint 1" })).data.map((t) => t.id)).toEqual([mine]);
    expect((await Todo.list({ ...src, stage: "none" })).data).toHaveLength(1);
  });

  withTestUser("starting stamps the actual start, finishing stamps the end", async () => {
    const { id } = await Todo.create({ title: "Do the thing" });

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
    const { id } = await Todo.create({ title: "False start", status: "active" });
    expect((await Todo.fromID(id))?.timeStarted).not.toBeNull();

    await Todo.update({ id, status: "backlog" });
    const todo = await Todo.fromID(id);
    expect(todo?.timeStarted).toBeNull();
    expect(todo?.timeDone).toBeNull();
  });

  withTestUser("assignment joins the user back in", async ({ userID }) => {
    const { id } = await Todo.create({ title: "Hand it over" });
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
    const { id: late } = await Todo.create({
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
    const { id } = await Todo.create({ title: "Tagged", tags: [" work ", "urgent", "urgent"] });
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
    const { id } = await Todo.create({ title: "Temporary" });
    await Todo.remove(id);
    const todo = await Todo.fromID(id);
    expect(todo).toBeNull();
  });

  withTestUser("a signed-out caller is denied", async () => {
    const { id } = await Todo.create({ title: "Private" });
    await Actor.provide("public", {}, async () => {
      // `list` guards before it touches a promise; `remove` is async, so the identical
      // throw surfaces as a rejection.
      expect(() => Todo.list({})).toThrow(/todo:read/);
      expect(() => Insights.stats({ start: "2026-01-01", end: "2026-01-31" })).toThrow(/todo:read/);
      await expect(Todo.remove(id)).rejects.toThrow(/todo:read/);
    });
  });

  withTestUser("sub-issues join the parent's owner, last among siblings", async () => {
    const src = project();
    const epic = await Todo.create({ title: "Epic", ...src });
    const first = await Todo.create({ title: "First", parentID: epic.id });
    const second = await Todo.create({ title: "Second", parentID: epic.id });
    expect(first.source).toBe("project");
    expect(first.sourceID).toBe(src.sourceID);
    expect([first.position, second.position]).toEqual([0, 1]);
    const kids = await Todo.list({ parentID: epic.id, sort: ["position"] });
    expect(kids.data.map((todo) => todo.title)).toEqual(["First", "Second"]);
    expect((await Todo.list({ ...src, parentID: "none" })).data.map((t) => t.id)).toEqual([
      epic.id,
    ]);
  });

  withTestUser("move reorders siblings and refuses cycles", async () => {
    const src = project();
    const epic = await Todo.create({ title: "Epic", ...src });
    const a = await Todo.create({ title: "A", parentID: epic.id });
    const b = await Todo.create({ title: "B", parentID: epic.id });
    const c = await Todo.create({ title: "C", parentID: epic.id });

    await Todo.move({ id: c.id, parentID: epic.id, position: 0 });
    const order = await Todo.list({ parentID: epic.id, sort: ["position"] });
    expect(order.data.map((todo) => todo.title)).toEqual(["C", "A", "B"]);

    // Out to the top level: the gap closes behind it.
    await Todo.move({ id: a.id, parentID: null });
    expect((await Todo.fromID(a.id))?.position).toBe(1);
    expect((await Todo.fromID(b.id))?.position).toBe(1);

    await Todo.move({ id: b.id, parentID: c.id });
    await expect(Todo.move({ id: epic.id, parentID: b.id })).rejects.toThrow(/under itself/);
    await expect(
      Todo.move({ id: b.id, parentID: (await Todo.create({ title: "Other", ...project() })).id }),
    ).rejects.toThrow(/same owner/);
  });

  withTestUser("removing a parent promotes its sub-issues", async () => {
    const src = project();
    const epic = await Todo.create({ title: "Epic", ...src });
    const kid = await Todo.create({ title: "Kid", parentID: epic.id });
    await Todo.remove(epic.id);
    const after = await Todo.fromID(kid.id);
    expect(after?.parentID).toBeNull();
    expect(after?.position).toBe(0);
  });

  withTestUser("annotations merge and drop keys; links swap without touching them", async () => {
    const { id } = await Todo.create({ title: "Annotated", links: [{ url: "https://a.dev" }] });
    await Todo.annotate({ id, set: { "example.com/a": "1", "example.com/b": "2" } });
    const after = await Todo.annotate({ id, unset: ["example.com/a"] });
    expect(after.metadata.annotations).toEqual({ "example.com/b": "2" });

    await Todo.update({ id, links: [{ url: "https://b.dev", title: "B" }] });
    const todo = await Todo.fromID(id);
    expect(todo?.metadata.links).toEqual([{ url: "https://b.dev", title: "B" }]);
    expect(todo?.metadata.annotations).toEqual({ "example.com/b": "2" });
  });

  withTestUser("concurrent link edits all land; a repeated url retitles", async () => {
    const { id } = await Todo.create({ title: "Linked" });
    await Promise.all(
      ["a", "b", "c"].map((name) => Todo.link({ id, url: `https://${name}.dev` })),
    );
    await Todo.link({ id, url: "https://b.dev", title: "B" });
    const after = await Todo.unlink({ id, url: "https://a.dev" });
    expect(after.metadata.links.map((item) => item.url).sort()).toEqual([
      "https://b.dev",
      "https://c.dev",
    ]);
    expect(after.metadata.links.find((item) => item.url === "https://b.dev")?.title).toBe("B");
  });

  withTestUser("github annotations belong to the sync engine, one todo per issue", async () => {
    const { id } = await Todo.create({ title: "Mirrored" });
    await expect(Todo.annotate({ id, set: { "github.com/issue": "acme/api#1" } })).rejects.toThrow(
      /written by their integration/,
    );

    const issue = String(Math.floor(Math.random() * 1e9));
    const other = await Todo.create({ title: "Duplicate" });
    await Actor.provide("system", {}, async () => {
      await Todo.annotate({ id, set: { "github.com/issue-id": issue } });
      await expect(
        Todo.annotate({ id: other.id, set: { "github.com/issue-id": issue } }),
      ).rejects.toThrow();
    });
  });

  withTestUser("system bypasses enforcement", async () => {
    const { id } = await Todo.create({ title: "Batch" });
    await Actor.provide("system", {}, async () => {
      await Todo.update({ id, title: "Renamed by a job" });
      expect((await Todo.fromID(id))?.title).toBe("Renamed by a job");
    });
  });
});
