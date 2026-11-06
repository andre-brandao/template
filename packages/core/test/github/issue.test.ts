import { describe, expect, test } from "bun:test";
import { Actor } from "../../src/actor";
import { Github } from "../../src/github";
import { Project } from "../../src/project";
import { Todo } from "../../src/todo";
import { withTestUser } from "../util";
import { deliver, issue, linked, repo } from "./fixtures";

describe("github issue mapping", () => {
  test("parses issue refs and repo lists", () => {
    expect(Github.Annotation.issue("acme/api#12")).toEqual({
      owner: "acme",
      repo: "api",
      number: 12,
    });
    expect(Github.Annotation.issue("nope")).toBeNull();
    expect(Github.Annotation.list("Acme/A, acme/b,,acme/a")).toEqual(["acme/a", "acme/b"]);
  });

  test("maps board columns, falling back to the issue state", () => {
    expect(Github.Issue.status("In Progress", "OPEN")).toBe("active");
    expect(Github.Issue.status("Todo", "open")).toBe("backlog");
    expect(Github.Issue.status("ready", "open")).toBe("planned");
    expect(Github.Issue.status(null, "CLOSED")).toBe("done");
    expect(Github.Issue.status("Weird", "open")).toBe("backlog");
  });

  test("decides sub-issue calls", () => {
    expect(Github.Issue.nesting("1", "1")).toBeNull();
    expect(Github.Issue.nesting("1", null)).toBe("add");
    expect(Github.Issue.nesting("1", "2")).toBe("add");
    expect(Github.Issue.nesting(null, "2")).toBe("remove");
  });

  test("removing closes an open issue only", () => {
    expect(Github.Issue.closeRemoved({ title: "", state: "open" })).toEqual({
      state: "closed",
      state_reason: "not_planned",
    });
    expect(Github.Issue.closeRemoved({ title: "", state: "closed" })).toEqual({});
  });

  withTestUser("an inbound edit produces no outbound write", async () => {
    const name = repo();
    const project = await Project.create({ name: "Echo" });
    await Github.Repo.connect({ projectID: project.id, repos: [name] });
    const data = issue();
    await Actor.provide("system", {}, () =>
      deliver("issues", { action: "opened", issue: data, repository: { full_name: name } }),
    );
    const before = (await linked(data.id))!;

    // GitHub now holds a new title, labels and a closed state; apply them as the webhook would.
    const remote = {
      ...data,
      title: "Renamed upstream",
      labels: [{ name: "Bug" }, { name: "ui" }],
      state: "closed",
      state_reason: "completed",
    };
    const patch = Github.Issue.diffInbound(before, remote);
    expect(Object.keys(patch).sort()).toEqual(["reason", "status", "tags", "title"]);
    await Todo.update({ id: before.id, ...patch });

    // The resulting todo.updated echo compares against GitHub and finds nothing to send.
    const after = (await Todo.fromID(before.id))!;
    expect(Github.Issue.diffOutbound(after, remote, ["title", "body", "tags", "status"])).toEqual(
      {},
    );
    expect(Github.Issue.diffInbound(after, remote)).toEqual({});
  });

  withTestUser("an outbound write sends only the keys that moved", async () => {
    const { id } = await Todo.create({ title: "Local", tags: ["bug"] });
    await Todo.update({ id, title: "Local edit", status: "done", reason: "completed" });
    const todo = (await Todo.fromID(id))!;
    const remote = { title: "Local", body: null, state: "open", labels: [{ name: "bug" }] };
    expect(Github.Issue.diffOutbound(todo, remote, ["title"])).toEqual({ title: "Local edit" });
    expect(Github.Issue.diffOutbound(todo, remote, ["title", "status"])).toEqual({
      title: "Local edit",
      state: "closed",
      state_reason: "completed",
    });
    // A field that changed locally but isn't among the keys is left alone.
    expect(Github.Issue.diffOutbound(todo, { ...remote, title: "Upstream" }, ["status"])).toEqual({
      state: "closed",
      state_reason: "completed",
    });
  });
});
