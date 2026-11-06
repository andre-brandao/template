import { z } from "zod";
import { Github } from "@template/core/github";
import { Project } from "@template/core/project";
import { remote } from "$lib/server/remote";

const Repo = z.object({ projectID: Project.Info.shape.id, repo: Github.Repo.Name });

export const getRepos = remote.query(Project.Info.shape.id, async (id) =>
  Github.Annotation.repos(await Project.assert.exists(Project.fromID(id))),
);

/** Core takes the whole list, so add and remove read the current one first. */
export const connectRepo = remote.form(Repo, async (input) => {
  const project = await Project.assert.exists(Project.fromID(input.projectID));
  return Github.Repo.connect({
    projectID: input.projectID,
    repos: [...Github.Annotation.repos(project), input.repo],
  });
});

export const disconnectRepo = remote.form(Repo, async (input) => {
  const project = await Project.assert.exists(Project.fromID(input.projectID));
  const repo = input.repo.toLowerCase();
  return Github.Repo.connect({
    projectID: input.projectID,
    repos: Github.Annotation.repos(project).filter((name) => name !== repo),
  });
});

export const importBoard = remote.form(Github.Board.pull.schema, Github.Board.pull);
