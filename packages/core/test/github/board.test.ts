import { describe, expect } from "bun:test";
import { Github } from "../../src/github";
import { withTestUser } from "../util";
import { issue, linked, repo } from "./fixtures";

describe("github board import", () => {
  withTestUser("is idempotent and nests sub-issues", async () => {
    const name = repo();
    const node = `PVT_${crypto.randomUUID()}`;
    const parent = issue();
    const child = issue();
    const item = (data: ReturnType<typeof issue>, extra: Partial<Github.Board.Item>) => ({
      id: data.id,
      number: data.number,
      title: data.title,
      body: data.body,
      state: data.state,
      reason: null,
      labels: ["bug"],
      repo: name,
      parent: null,
      column: null,
      ...extra,
    });
    const board = {
      id: node,
      title: "Roadmap",
      description: null,
      items: [
        item(child, { parent: parent.id, column: "In Progress" }),
        item(parent, { state: "closed", reason: "not_planned" }),
      ],
    };

    const first = await Github.Board.ingest(board);
    expect(first.created).toBe(2);
    expect(first.project.metadata.annotations["github.com/project"]).toBe(node);
    expect(Github.Annotation.repos(first.project)).toEqual([name]);
    const [kid, up] = [await linked(child.id), await linked(parent.id)];
    expect(kid?.status).toBe("active");
    expect(kid?.parentID).toBe(up!.id);
    expect(up?.status).toBe("done");
    expect(up?.reason).toBe("not_planned");

    const again = await Github.Board.ingest(board);
    expect(again.project.id).toBe(first.project.id);
    expect(again.created).toBe(0);
    expect(again.skipped).toBe(2);
  });
});
