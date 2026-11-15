import { describe, expect } from "bun:test";
import { setupApiTest } from "./util";
import { Project } from "@template/core/project";
import { Examples } from "@template/core/examples";

const { test, validateOpenAPIRoute, del } = setupApiTest();

describe("project", () => {
  test("GET /project", async () => {
    const response = await validateOpenAPIRoute("get", "/project");
    expect(response.data).toBeArray();
  });

  test("POST /project", async () => {
    const response = await validateOpenAPIRoute("post", "/project", undefined, {
      name: Examples.Project.name,
    });
    const created = await Project.fromID(response.id);
    expect(created!.name).toBe(Examples.Project.name);
  });

  test("GET /project/:id", async () => {
    const { id } = await Project.create({ name: "Fetch me" });
    const response = await validateOpenAPIRoute("get", "/project/:id", { id });
    expect(response.id).toBe(id);
  });

  test("PATCH /project/:id", async () => {
    const { id } = await Project.create({ name: "Old" });
    const response = await validateOpenAPIRoute("patch", "/project/:id", { id }, { name: "New" });
    expect(response.name).toBe("New");
  });

  test("POST /project/:id/link", async () => {
    const { id } = await Project.create({ name: "Linked" });
    const response = await validateOpenAPIRoute(
      "post",
      "/project/:id/link",
      { id },
      { url: "https://example.com", title: "Example" },
    );
    expect(response.metadata.links).toEqual([{ url: "https://example.com", title: "Example" }]);
  });

  test("DELETE /project/:id/link", async () => {
    const { id } = await Project.create({ name: "Unlinked" });
    await Project.link({ id, url: "https://example.com" });
    const response = await validateOpenAPIRoute("delete", "/project/:id/link", {
      id,
      url: "https://example.com",
    });
    expect(response.metadata.links).toEqual([]);
    // No body to break, so the declared 400 is driven by a missing `url`.
    expect((await del(`/project/${id}/link`)).status).toBe(400);
  });

  test("DELETE /project/:id", async () => {
    const { id } = await Project.create({ name: "Temporary" });
    await validateOpenAPIRoute("delete", "/project/:id", { id });
    expect(await Project.fromID(id)).toBeNull();
  });
});
