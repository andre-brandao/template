import { describe, expect } from "bun:test";
import { Insights, Todo } from "../src/todo";
import { withTestUser } from "./util";

const DAY = 86_400_000;

function range(days = 30) {
  return {
    start: new Date(Date.now() - days * DAY).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  };
}

describe("insights", () => {
  withTestUser("stats aggregates totals, rate and open count", async () => {
    const id = await Todo.create({ title: "One" });
    await Todo.create({ title: "Two" });
    await Todo.update({ id, state: "closed" });
    const stats = await Insights.stats(range());
    expect(stats.total).toBe(2);
    expect(stats.done).toBe(1);
    expect(stats.open).toBe(1);
    expect(stats.rate).toBe(50);
    expect(stats.overdue).toBe(0);
  });

  withTestUser("status returns totals and bar widths", async () => {
    await Todo.create({ title: "One" });
    const status = await Insights.status(range());
    expect(status.total).toBe(1);
    expect(status.rows.find((row) => row.state === "open")?.pct).toBe(100);
    expect(status.rows.find((row) => row.state === "closed")?.total).toBe(0);
  });

  withTestUser("activity flags active ranges and buckets creations", async () => {
    await Todo.create({ title: "One" });
    const activity = await Insights.activity(range());
    expect(activity.active).toBe(true);
    expect(activity.series.reduce((sum, point) => sum + point.created, 0)).toBe(1);
  });
});
