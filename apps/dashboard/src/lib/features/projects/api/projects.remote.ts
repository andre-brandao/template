import { query } from "$app/server";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import { Project } from "@template/core/project";
import { auth, remote } from "$lib/server/remote";

export const getProjects = query(z.object({ q: z.string().optional() }), async (input) => {
  auth();
  const { data } = await Project.list({ search: input.q, pageSize: 100 });
  return data;
});

export const getProject = query(Project.Info.shape.id, async (id) => {
  auth();
  const project = await Project.fromID(id);
  if (!project) error(404, "Project not found");
  return project;
});

export const createProject = remote(Project.create)
  .with(
    Project.create.schema.extend({
      description: z
        .string()
        .optional()
        .transform((s) => s || undefined),
    }),
  )
  .form();

export const updateProject = remote(Project.update)
  .with(
    z.object({
      id: Project.Info.shape.id,
      name: Project.Info.shape.name,
      description: z
        .string()
        .optional()
        .transform((s) => s || null),
    }),
  )
  .form();

export const removeProject = remote(Project.remove)
  .with(z.object({ id: Project.Info.shape.id }).transform((input) => input.id))
  .form();
