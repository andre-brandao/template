import { describe, expect, test } from "bun:test";
import { Actor } from "../../src/actor";
import { Github } from "../../src/github";
import { Project } from "../../src/project";
import { Todo } from "../../src/todo";
import { withTestUser } from "../util";
import { deliver, issue, linked, repo } from "./fixtures";

describe("github webhooks", () => {
  test("checks the signature", async () => {
    const body = '{"zen":"ok"}';
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("s3cret"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const hex = Buffer.from(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
    ).toString("hex");
    expect(await Github.Webhook.verify("s3cret", body, `sha256=${hex}`)).toBe(true);
    expect(await Github.Webhook.verify("other", body, `sha256=${hex}`)).toBe(false);
    expect(await Github.Webhook.verify("s3cret", body, null)).toBe(false);
    expect(await Github.Webhook.verify("", body, `sha256=${hex}`)).toBe(false);
  });

  withTestUser("drive a todo through its life", async ({ userID }) => {
    const name = repo();
    const project = await Project.create({ name: "Synced" });
    await Github.Repo.connect({ projectID: project.id, repos: [name] });
    const data = issue();
    const repository = { full_name: name };

    await Actor.provide("system", {}, async () => {
      await deliver("issues", { action: "opened", issue: data, repository });
      // A redelivery is a no-op.
      await deliver("issues", { action: "opened", issue: data, repository });
    });
    const todo = await linked(data.id);
    expect(todo?.sourceID).toBe(project.id);
    expect(todo?.createdBy).toBe(userID);
    expect(todo?.tags).toEqual(["bug"]);
    expect(todo?.metadata.annotations["github.com/issue"]).toBe(`${name}#${data.number}`);
    expect((await Todo.list({ source: "project", sourceID: project.id })).total).toBe(1);

    await Actor.provide("system", {}, () =>
      deliver("issues", {
        action: "edited",
        issue: { ...data, title: "Crash on save (v2)", labels: [{ name: "p1" }] },
        repository,
      }),
    );
    const edited = await Todo.fromID(todo!.id);
    expect(edited?.title).toBe("Crash on save (v2)");
    expect(edited?.tags).toEqual(["p1"]);

    await Actor.provide("system", {}, () =>
      deliver("issues", {
        action: "closed",
        issue: { ...data, state: "closed", state_reason: "not_planned" },
        repository,
      }),
    );
    const closed = await Todo.fromID(todo!.id);
    expect(closed?.status).toBe("done");
    expect(closed?.reason).toBe("not_planned");

    await Actor.provide("system", {}, () =>
      deliver("issues", { action: "reopened", issue: data, repository }),
    );
    expect((await Todo.fromID(todo!.id))?.status).toBe("planned");

    const child = issue();
    await Actor.provide("system", {}, async () => {
      await deliver("issues", { action: "opened", issue: child, repository });
      await deliver("sub_issues", {
        action: "sub_issue_added",
        parent_issue: data,
        sub_issue: child,
      });
    });
    const kid = await linked(child.id);
    expect(kid?.parentID).toBe(todo!.id);
    await Actor.provide("system", {}, () =>
      deliver("sub_issues", { action: "sub_issue_removed", parent_issue: data, sub_issue: child }),
    );
    expect((await Todo.fromID(kid!.id))?.parentID).toBeNull();

    await Actor.provide("system", {}, () =>
      deliver("issues", { action: "deleted", issue: data, repository }),
    );
    expect(await Todo.fromID(todo!.id)).toBeNull();
  });

  withTestUser("issues in unconnected repos are ignored", async () => {
    const data = issue();
    await Actor.provide("system", {}, () =>
      deliver("issues", { action: "opened", issue: data, repository: { full_name: repo() } }),
    );
    expect(await linked(data.id)).toBeUndefined();
  });
});
