import { z } from "zod";
import { and, isNull, sql } from "drizzle-orm";
import { fn } from "../../util/fn";
import { Actor } from "../../actor";
import { Database } from "../../drizzle";
import { ErrorCodes, VisibleError } from "../../error";
import { Project } from "../../project";
import { ProjectTable } from "../../project/project.sql";
import { Annotation } from "../annotation";

/** Which repositories feed which project. A repository belongs to one project at a time. */
export namespace Repo {
  export const Name = z
    .string()
    .trim()
    .regex(/^[\w.-]+\/[\w.-]+$/, "Repositories are written owner/name")
    .meta({ description: "A repository as `owner/name`.", example: "acme/api" });

  /** Connects a project to repositories — the whole list, so an empty one disconnects it. */
  export const connect = fn(
    z.object({
      projectID: Project.Info.shape.id,
      repos: Name.array().max(50).meta({ description: "Every repository, as `owner/name`." }),
    }),
    async (input) => {
      const project = await Project.assert.exists(Project.fromID(input.projectID));
      Actor.check({ project: ["update"] }, project.createdBy);
      const list = Annotation.list(input.repos.join(","));
      await claim(project.id, list);
      return Actor.provide("system", {}, () =>
        Project.annotate(
          list.length
            ? { id: project.id, set: { [Annotation.Keys.repos]: list.join(",") } }
            : { id: project.id, unset: [Annotation.Keys.repos] },
        ),
      );
    },
    {
      title: "Connect GitHub repositories",
      description:
        "Set the repositories whose issues sync into a project. A repository belongs to one project at a time.",
    },
  );

  /** The project a repo's new issues land in. */
  export async function owner(repo: string) {
    const [row] = await holders([repo.toLowerCase()]);
    return row ? Project.fromID(row.id) : null;
  }

  /** Refuses repos another live project already holds; `id` is the project claiming them. */
  export async function claim(id: string | null, list: string[]) {
    if (!list.length) return;
    const [taken] = (await holders(list)).filter((row) => row.id !== id);
    if (!taken) return;
    const repo = list.find((name) => Annotation.repos(taken).includes(name));
    throw new VisibleError(
      "validation",
      ErrorCodes.Validation.IN_USE,
      `${repo} is already connected to ${taken.name}`,
      "repos",
    );
  }

  // === UTILS ===

  /** Projects listing any of `list` in their repos. */
  function holders(list: string[]) {
    return Database.use((tx) =>
      tx
        .select({ id: ProjectTable.id, name: ProjectTable.name, metadata: ProjectTable.metadata })
        .from(ProjectTable)
        .where(
          and(
            isNull(ProjectTable.timeDeleted),
            sql`string_to_array(lower(${ProjectTable.metadata} -> 'annotations' ->> ${Annotation.Keys.repos}), ',') && array[${sql.join(
              list.map((repo) => sql`${repo}`),
              sql`, `,
            )}]::text[]`,
          ),
        ),
    );
  }
}
