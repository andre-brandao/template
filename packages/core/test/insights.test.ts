import { describe, expect } from "bun:test";
import { Insights, Todo } from "../src/todo";
import { Identifier } from "../src/identifier";
import { withTestUser } from "./util";

const DAY = 86_400_000;

// Insights are workspace-wide, so each test scopes itself to its own project.
function range(days = 30) {
  return {
    source: "project",
    sourceID: Identifier.create("project"),
    start: new Date(Date.now() - days * DAY).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  };
}

const scoped = (r: ReturnType<typeof range>) => ({ source: r.source, sourceID: r.sourceID });

describe("insights", () => {
  withTestUser("stats aggregates totals, rate and in-flight counts", async () => {
    const r = range();
    const done = await Todo.create({ title: "One", ...scoped(r) });
    const active = await Todo.create({ title: "Two", ...scoped(r) });
    await Todo.update({ id: done, status: "done" });
    await Todo.update({ id: active, status: "active" });

    const stats = await Insights.stats(r);
    expect(stats.total).toBe(2);
    expect(stats.done).toBe(1);
    expect(stats.active).toBe(1);
    expect(stats.blocked).toBe(0);
    expect(stats.rate).toBe(50);
    expect(stats.overdue).toBe(0);
  });

  withTestUser("stats counts unfinished todos past their due date", async () => {
    const r = range();
    await Todo.create({
      title: "Late",
      dueDate: new Date(Date.now() - DAY).toISOString(),
      ...scoped(r),
    });
    expect((await Insights.stats(r)).overdue).toBe(1);
  });

  withTestUser("status returns totals and bar widths", async () => {
    const r = range();
    await Todo.create({ title: "One", ...scoped(r) });
    const status = await Insights.status(r);
    expect(status.total).toBe(1);
    expect(status.rows.find((row) => row.status === "backlog")?.pct).toBe(100);
    expect(status.rows.find((row) => row.status === "done")?.total).toBe(0);
  });

  withTestUser("load breaks work down per assignee", async ({ userID }) => {
    const r = range();
    const id = await Todo.create({ title: "Mine", assignee: userID, ...scoped(r) });
    await Todo.create({ title: "Nobody's", ...scoped(r) });
    await Todo.update({ id, status: "active" });

    const load = await Insights.load(r);
    expect(load.rows).toHaveLength(2);
    expect(load.rows.find((row) => row.name === "Test User")).toMatchObject({
      total: 1,
      active: 1,
    });
    expect(load.rows.find((row) => row.name === "Unassigned")?.total).toBe(1);
  });

  withTestUser("activity flags active ranges and buckets creations", async () => {
    const r = range();
    const id = await Todo.create({ title: "One", ...scoped(r) });
    await Todo.update({ id, status: "done" });
    const activity = await Insights.activity(r);
    expect(activity.active).toBe(true);
    expect(activity.series.reduce((sum, point) => sum + point.created, 0)).toBe(1);
    expect(activity.series.reduce((sum, point) => sum + point.completed, 0)).toBe(1);
  });
});
