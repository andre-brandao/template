import { describe, expect } from "bun:test";
import { Event } from "../src/event";
import { Todo } from "../src/todo";
import { withTestUser } from "./util";

describe("event", () => {
  withTestUser("create stores actor tag and userID", async ({ userID }) => {
    const id = await Event.create({ type: "test.thing", source: "test", sourceID: "abc" });
    const events = await Event.list({ source: "test", sourceID: "abc" });
    expect(events[0]?.id).toBe(id);
    expect(events[0]?.userID).toBe(userID);
    expect(events[0]?.tags).toContain("actor:user");
  });

  withTestUser("list filters by type and tags", async () => {
    await Event.create({ type: "test.a", tags: ["urgent"] });
    await Event.create({ type: "test.b", tags: ["chill"] });
    const urgent = await Event.list({ tags: ["urgent"] });
    expect(urgent.every((e) => e.type === "test.a")).toBe(true);
    const byType = await Event.list({ type: "test.b" });
    expect(byType).toHaveLength(1);
  });

  withTestUser("todo mutations emit the expected event trail", async () => {
    const id = await Todo.create({ title: "Ship it", tags: ["work"] });
    await Todo.update({ id, state: "closed" });
    await Todo.update({ id, state: "open" });
    await Todo.remove(id);

    const events = await Event.list({ source: "todo", sourceID: id });
    const types = events.map((e) => e.type).sort();
    expect(types).toEqual(["todo.closed", "todo.created", "todo.removed", "todo.reopened"].sort());
    expect(events.every((e) => e.tags.includes("work"))).toBe(true);
  });
});
