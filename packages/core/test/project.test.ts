import { describe, expect } from "bun:test";
import { Actor } from "../src/actor";
import { Project } from "../src/project";
import { Todo } from "../src/todo";
import { withTestUser } from "./util";

describe("project", () => {
  withTestUser("create and fetch a project", async ({ userID }) => {
    const id = await Project.create({ name: "Quarterly close" });
    const project = await Project.fromID(id);
    expect(project?.name).toBe("Quarterly close");
    expect(project?.description).toBeNull();
    expect(project?.createdBy).toBe(userID);
  });

  withTestUser("list finds projects by name", async () => {
    const name = `Apollo ${crypto.randomUUID()}`;
    await Project.create({ name });
    const page = await Project.list({ search: name });
    expect(page.data.map((project) => project.name)).toEqual([name]);
  });

  withTestUser("todos hang off a project through source", async () => {
    const sourceID = await Project.create({ name: "Apollo" });
    await Todo.create({ title: "Build the rocket", source: "project", sourceID });
    const page = await Todo.list({ source: "project", sourceID });
    expect(page.data.map((todo) => todo.title)).toEqual(["Build the rocket"]);
  });

  withTestUser("update renames the project", async () => {
    const id = await Project.create({ name: "Old" });
    await Project.update({ id, name: "New", description: "now with a blurb" });
    expect((await Project.fromID(id))?.name).toBe("New");
    expect((await Project.fromID(id))?.description).toBe("now with a blurb");
  });

  withTestUser("remove soft-deletes the project but keeps its todos", async () => {
    const sourceID = await Project.create({ name: "Doomed" });
    await Todo.create({ title: "Survivor", source: "project", sourceID });
    await Project.remove(sourceID);

    expect(await Project.fromID(sourceID)).toBeNull();
    expect((await Todo.list({ source: "project", sourceID })).data).toHaveLength(1);
  });

  withTestUser("a signed-out caller is denied", async () => {
    const id = await Project.create({ name: "Private" });
    await Actor.provide("public", {}, async () => {
      // `list` guards before it touches a promise, same as the zod parse in `fn`; `remove`
      // is async, so the identical throw surfaces as a rejection.
      expect(() => Project.list({})).toThrow(/project:read/);
      await expect(Project.remove(id)).rejects.toThrow(/project:read/);
    });
  });

  // `member` is permissive on projects today, so ownership is exercised through the actor
  // rather than the role map. This is the seam that tightens to `delete:own` later.
  withTestUser("the owner argument reaches the check", async ({ userID }) => {
    const id = await Project.create({ name: "Mine" });
    const before = await Project.fromID(id);
    expect(before?.createdBy).toBe(userID);
    expect(Actor.can({ project: ["delete"] }, before?.createdBy)).toBe(true);
  });

  withTestUser("system bypasses enforcement", async () => {
    const id = await Project.create({ name: "Batch" });
    await Actor.provide("system", {}, async () => {
      await Project.update({ id, name: "Renamed by a job" });
      expect((await Project.fromID(id))?.name).toBe("Renamed by a job");
    });
  });
});
