import { describe, expect } from "bun:test";
import { Github } from "../../src/github";
import { Project } from "../../src/project";
import { withTestUser } from "../util";
import { repo } from "./fixtures";

describe("github repos", () => {
  withTestUser("connect enforces one project per repo, written as system", async () => {
    const name = repo();
    const a = await Project.create({ name: "A" });
    const b = await Project.create({ name: "B" });
    const done = await Github.Repo.connect({ projectID: a.id, repos: [name, name.toUpperCase()] });
    expect(Github.Annotation.repos(done)).toEqual([name]);
    await expect(Github.Repo.connect({ projectID: b.id, repos: [name] })).rejects.toThrow(
      /already/,
    );
    // Reconnecting the holder is fine; an empty list disconnects it.
    await Github.Repo.connect({ projectID: a.id, repos: [name] });
    expect(
      Github.Annotation.repos(await Github.Repo.connect({ projectID: a.id, repos: [] })),
    ).toEqual([]);
    // People can't forge the link themselves.
    await expect(
      Project.annotate({ id: a.id, set: { "github.com/repos": name } }),
    ).rejects.toThrow();
  });
});
