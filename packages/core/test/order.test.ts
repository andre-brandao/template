import { describe, expect } from "bun:test";
import { Actor } from "../src/actor";
import { Admin } from "../src/platform/admin";
import { Todo } from "../src/todo";
import { User } from "../src/user";
import { Event } from "../src/platform/event";
import { Identifier } from "../src/identifier";
import { testEmail, withTestUser } from "./util";

const project = () => ({ source: "project", sourceID: Identifier.create("project") });

const titles = (page: { data: Todo.Info[] }) => page.data.map((todo) => todo.title);

const mint = (name: string) =>
  Actor.provide("system", {}, async () => (await User.create({ name, email: testEmail() })).id);

describe("order", () => {
  withTestUser("sorts ascending and descending on one key", async () => {
    const src = project();
    for (const title of ["Beta", "Alpha", "Gamma"]) await Todo.create({ title, ...src });

    expect(titles(await Todo.list({ ...src, sort: ["title"] }))).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
    expect(titles(await Todo.list({ ...src, sort: ["-title"] }))).toEqual([
      "Gamma",
      "Beta",
      "Alpha",
    ]);
  });

  withTestUser("applies keys in priority order", async () => {
    const src = project();
    await Todo.create({ title: "B", status: "active", ...src });
    await Todo.create({ title: "A", status: "active", ...src });
    await Todo.create({ title: "C", status: "backlog", ...src });

    // Status ranks by pipeline, so backlog leads active; title then breaks the tie.
    expect(titles(await Todo.list({ ...src, sort: ["status", "title"] }))).toEqual(["C", "A", "B"]);
    expect(titles(await Todo.list({ ...src, sort: ["status", "-title"] }))).toEqual([
      "C",
      "B",
      "A",
    ]);
  });

  withTestUser("sorts assignee by the joined name, not the stored id", async () => {
    const src = project();
    // ULIDs are monotonic, so the user created first holds the lower id — naming them in
    // reverse makes an id sort and a name sort disagree.
    const zoe = await mint("Zoe");
    const amy = await mint("Amy");
    await Todo.create({ title: "Zoe's", assignee: zoe, ...src });
    await Todo.create({ title: "Amy's", assignee: amy, ...src });
    expect(zoe < amy).toBe(true);

    expect(titles(await Todo.list({ ...src, sort: ["assignee"] }))).toEqual(["Amy's", "Zoe's"]);
    expect(titles(await Todo.list({ ...src, sort: ["-assignee"] }))).toEqual(["Zoe's", "Amy's"]);
  });

  withTestUser("keeps nulls last in both directions", async () => {
    const src = project();
    await Todo.create({ title: "Later", dueDate: "2030-06-01T00:00:00.000Z", ...src });
    await Todo.create({ title: "Nothing", ...src });
    await Todo.create({ title: "Sooner", dueDate: "2030-01-01T00:00:00.000Z", ...src });

    expect(titles(await Todo.list({ ...src, sort: ["dueDate"] }))).toEqual([
      "Sooner",
      "Later",
      "Nothing",
    ]);
    expect(titles(await Todo.list({ ...src, sort: ["-dueDate"] }))).toEqual([
      "Later",
      "Sooner",
      "Nothing",
    ]);
  });

  withTestUser("pages a non-unique sort without repeating or dropping rows", async () => {
    const src = project();
    for (const title of ["A", "B", "C", "D", "E"]) {
      await Todo.create({ title, status: "active", ...src });
    }

    // Every row ties on status, so only the id tiebreak keeps the window stable.
    const seen = [];
    for (const page of [1, 2, 3]) {
      seen.push(...titles(await Todo.list({ ...src, sort: ["status"], page, pageSize: 2 })));
    }
    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
  });

  withTestUser("rejects keys outside the schema", async () => {
    // `fn()` parses before it calls, so this throws rather than rejecting.
    expect(() => Todo.list({ ...project(), sort: ["bogus" as never] })).toThrow();
  });

  withTestUser("falls back rather than trusting an unvalidated key", async () => {
    const src = project();
    await Todo.create({ title: "Only", ...src });

    // `force` skips the enum, so the helper's own guard is what stops a prototype key
    // reaching drizzle.
    const keys: any = [["constructor"], ["toString"], ["missing"]];
    for (const sort of keys) {
      expect(titles(await Todo.list.force({ ...src, sort }))).toEqual(["Only"]);
    }
  });
});

describe("order across namespaces", () => {
  withTestUser(
    "sorts the admin user directory by name and email",
    async () => {
      // The directory is global, so scope the read to this test's own users: every other
      // test mints one, and past a page of them the assertion reads a truncated page.
      const tag = Identifier.create("user");
      await mint(`Yara Zt ${tag}`);
      await mint(`Abe Aa ${tag}`);

      const asc = await Admin.users({ search: tag, sort: ["name"] });
      const desc = await Admin.users({ search: tag, sort: ["-name"] });
      expect(asc.data.map((one) => one.name)).toEqual([`Abe Aa ${tag}`, `Yara Zt ${tag}`]);
      expect(desc.data.map((one) => one.name)).toEqual([`Yara Zt ${tag}`, `Abe Aa ${tag}`]);
    },
    "admin",
  );

  withTestUser(
    "sorts the event log by type within a scope",
    async () => {
      const { id } = await Todo.create({ title: "Audited" });
      await Todo.update({ id, status: "active" });

      // A todo's own event stream — scoped so other tests cannot leak into the assertion.
      const scope = { source: "todo", sourceID: id };
      const asc = (await Event.list({ ...scope, sort: ["type"], pageSize: 100 })).data;
      const desc = (await Event.list({ ...scope, sort: ["-type"], pageSize: 100 })).data;

      expect(asc.length).toBeGreaterThan(1);
      const types = asc.map((one) => one.type);
      expect(types).toEqual([...types].sort((a, b) => a.localeCompare(b)));
      expect(desc[0]?.type).toBe(types[types.length - 1]);
    },
    "admin",
  );
});
