import { z } from "zod";
import { Project } from "@template/core/project";
import { remote } from "$lib/server/remote";

export const getProjects = remote.query(z.object({ q: z.string().optional() }), async (input) => {
  const { data } = await Project.list({ search: input.q, pageSize: 100 });
  return data;
});

export const getProject = remote.query(Project.Info.shape.id, (id) =>
  Project.assert.exists(Project.fromID(id)),
);

export const createProject = remote.form(
  Project.create.schema.extend({
    description: z
      .string()
      .optional()
      .transform((s) => s || undefined),
  }),
  Project.create,
);

export const updateProject = remote.form(
  z.object({
    id: Project.Info.shape.id,
    name: Project.Info.shape.name,
    description: z
      .string()
      .optional()
      .transform((s) => s || null),
  }),
  Project.update,
);

// A command, not a form: it is only ever reached through `modal.confirm`, and the caller
// navigates away to the list, which remounts its query.
export const removeProject = remote.core(Project.remove).command();
