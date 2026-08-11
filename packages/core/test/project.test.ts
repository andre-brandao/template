import { describe, expect } from "bun:test";
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
});
