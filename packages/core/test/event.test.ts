import { describe, expect } from "bun:test";
import { Actor } from "../src/actor";
import { Event } from "../src/event";
import { Identifier } from "../src/identifier";
import { Todo } from "../src/todo";
import { User } from "../src/user";
import { testEmail, withTestUser } from "./util";

describe("event", () => {
  // The log is global now, so every assertion has to pin itself to a marker no other test
  // can produce — a shared `sourceID` or tag would match another file's rows.
  withTestUser("create stores actor tag and userID", async ({ userID }) => {
    // `source_id` is char(30), so the marker has to be id-shaped rather than a raw uuid.
    const at = Identifier.create("event");
    const id = await Event.create({ type: "test.thing", source: "test", sourceID: at });
    const events = (await Event.list({ source: "test", sourceID: at })).data;
    expect(events[0]?.id).toBe(id);
    expect(events[0]?.userID).toBe(userID);
    expect(events[0]?.user?.id).toBe(userID);
    expect(events[0]?.tags).toContain("actor:user");
  });

  withTestUser(
    "list filters by type and tags",
    async () => {
      const tag = crypto.randomUUID();
      const type = `test.b.${crypto.randomUUID()}`;
      await Event.create({ type: "test.a", tags: [tag] });
      await Event.create({ type, tags: ["chill"] });
      const urgent = await Event.list({ tags: [tag] });
      expect(urgent.data.every((e) => e.type === "test.a")).toBe(true);
      const byType = await Event.list({ type });
      expect(byType.total).toBe(1);
    },
    // Unpinned from a `sourceID`, so it needs the back-office grant.
    "admin",
  );

  withTestUser("an unpinned read is refused without the admin grant", async () => {
    expect(() => Event.list({ type: "test.a" })).toThrow(/admin:read/);
  });

  withTestUser("a pinned read shows every actor, not just the caller", async ({ userID }) => {
    const id = await Todo.create({ title: "Shared", source: "test", sourceID: "shared" });
    const mate = await Actor.provide("system", {}, () =>
      User.create({ name: "Mate", email: testEmail() }),
    );
    await Actor.provide("user", { userID: mate, role: "member" }, () =>
      Todo.update({ id, status: "active" }),
    );

    const events = (await Event.list({ source: "todo", sourceID: id })).data;
    expect(events.map((e) => e.userID)).toContain(mate);
    expect(events.map((e) => e.userID)).toContain(userID);
  });

  withTestUser("todo mutations emit the expected event trail", async ({ userID }) => {
    const id = await Todo.create({ title: "Ship it", tags: ["work"] });
    await Todo.update({ id, status: "active" });
    await Todo.update({ id, assignee: userID });
    await Todo.update({ id, status: "done" });
    await Todo.remove(id);

    const events = (await Event.list({ source: "todo", sourceID: id })).data;
    const types = events.map((e) => e.type).sort();
    // Each move also emits the public `todo.updated`, which is the only type webhooks see.
    expect(types).toEqual(
      [
        "todo.assigned",
        "todo.created",
        "todo.removed",
        "todo.status",
        "todo.status",
        "todo.updated",
        "todo.updated",
        "todo.updated",
      ].sort(),
    );
    expect(events.every((e) => e.tags.includes("work"))).toBe(true);
  });
});
