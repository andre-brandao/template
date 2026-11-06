import { z } from "zod";
import { and, isNull, sql } from "drizzle-orm";
import { fn } from "../../util/fn";
import { Actor } from "../../actor";
import { Database } from "../../drizzle";
import { ErrorCodes, VisibleError } from "../../error";
import { Project } from "../../project";
import { ProjectTable } from "../../project/project.sql";
import { Todo } from "../../todo";
import { Annotation } from "../annotation";
import { forActor } from "../client";
import { Issue } from "../issue";
import { Repo } from "../repo";
import { read } from "./query";

/** Importing a GitHub Project v2 board as a project. Re-running only adds what is new. */
export namespace Board {
  export const Item = z
    .object({
      id: z.number().meta({ description: "GitHub's numeric issue id." }),
      number: z.number().meta({ description: "Issue number within its repository." }),
      title: z.string(),
      body: z.string().nullable(),
      state: z.string().meta({ description: "`open` or `closed`." }),
      reason: z.string().nullable().meta({ description: "`state_reason`, lowercased." }),
      labels: z.string().array(),
      repo: Repo.Name,
      parent: z.number().nullable().meta({ description: "The parent issue's numeric id." }),
      column: z.string().nullable().meta({ description: "The board's Status column." }),
    })
    .meta({ description: "One issue on a GitHub Project board." });
  export type Item = z.infer<typeof Item>;

  export const Info = z
    .object({
      id: z.string().meta({ description: "The Project v2 node id." }),
      title: z.string(),
      description: z.string().nullable(),
      items: Item.array(),
    })
    .meta({ description: "A GitHub Project v2, read in full." });
  export type Info = z.infer<typeof Info>;

  export const Imported = z
    .object({
      project: Project.Info,
      created: z.number().meta({ description: "Todos created for issues not seen before." }),
      skipped: z.number().meta({ description: "Issues that already had a todo." }),
    })
    .meta({ description: "What an import did." });

  /** Reads a board with the caller's GitHub token, then ingests it. */
  export const pull = fn(
    z.object({
      owner: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .meta({ description: "The organization or user login that owns the board." }),
      number: z
        .number()
        .int()
        .positive()
        .meta({ description: "The board's number, from its URL." }),
    }),
    async (input) => {
      Actor.check({ project: ["create"], todo: ["create"] });
      const api = await forActor();
      if (!api)
        throw new VisibleError(
          "validation",
          ErrorCodes.Validation.INVALID_STATE,
          "Sign in with GitHub to import its projects",
        );
      return ingest(await read(api, input.owner, input.number));
    },
    {
      title: "Import GitHub project",
      description:
        "Import a GitHub Project v2 board: a project for it, its repositories connected, a todo per issue, nested like the issues.",
    },
  );

  /** The write half of an import, from a board already read. Idempotent per issue. */
  export const ingest = fn(Info, async (input) => {
    const project = await place(input);
    const todos = new Map<number, Todo.Info>();
    let created = 0;
    for (const item of input.items) {
      const known = await Issue.find(item.id);
      if (!known) created++;
      todos.set(item.id, known ?? (await mirror(project.id, item)));
    }
    for (const item of input.items) await nest(todos, item);
    return {
      project: await Project.assert.exists(Project.fromID(project.id)),
      created,
      skipped: input.items.length - created,
    };
  });

  // === UTILS ===

  /** The board's project: the one an earlier import made, else a new one. Repos claimed, ids annotated. */
  async function place(input: Info) {
    const found = await adopted(input.id);
    const list = [
      ...new Set([
        ...(found ? Annotation.repos(found) : []),
        ...input.items.map((item) => item.repo.toLowerCase()),
      ]),
    ];
    await Repo.claim(found?.id ?? null, list);
    const project =
      found ??
      (await Project.create({
        name: input.title.slice(0, 200) || "GitHub project",
        description: input.description?.slice(0, 2000) || undefined,
      }));
    Actor.check({ project: ["update"] }, project.createdBy);
    await Actor.provide("system", {}, () =>
      Project.annotate({
        id: project.id,
        set: {
          [Annotation.Keys.project]: input.id,
          ...(list.length ? { [Annotation.Keys.repos]: list.join(",") } : {}),
        },
      }),
    );
    return project;
  }

  function mirror(projectID: string, item: Item) {
    return Issue.mirror(projectID, item.repo, {
      ...item,
      labels: item.labels.map((name) => ({ name })),
      state_reason: item.reason,
      status: Issue.status(item.column, item.state),
    });
  }

  /** Nests an item's todo under its parent's, when both made it in under one owner. */
  async function nest(todos: Map<number, Todo.Info>, item: Item) {
    const child = todos.get(item.id);
    const parent = item.parent ? todos.get(item.parent) : undefined;
    if (!child || !parent || child.parentID === parent.id || !Issue.sameOwner(child, parent))
      return;
    await Todo.move({ id: child.id, parentID: parent.id });
  }

  /** The project an earlier import of this board made. */
  async function adopted(node: string) {
    const [row] = await Database.use((tx) =>
      tx
        .select({ id: ProjectTable.id })
        .from(ProjectTable)
        .where(
          and(
            isNull(ProjectTable.timeDeleted),
            sql`${ProjectTable.metadata} -> 'annotations' ->> ${Annotation.Keys.project} = ${node}`,
          ),
        ),
    );
    return row ? Project.fromID(row.id) : null;
  }
}
