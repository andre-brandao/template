import { z } from "zod";
import { and, isNull, sql } from "drizzle-orm";
import { Actor } from "../../actor";
import { Database } from "../../drizzle";
import { Todo } from "../../todo";
import { TodoTable } from "../../todo/todo.sql";
import { clean } from "../../util/tag";
import { Annotation } from "../annotation";

/**
 * An issue against the todo that mirrors it: what each side means to the other, and
 * whether they already agree. The diffs are pure, so loop safety is testable offline.
 */
export namespace Issue {
  /** An issue as a webhook delivers it, narrowed to the fields the sync reads. */
  export const Payload = z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    body: z.string().nullable().optional(),
    state: z.string(),
    state_reason: z.string().nullable().optional(),
    labels: z.object({ name: z.string() }).array().optional(),
  });

  /** The fields the diffs read; REST may hand a label over as its bare name. */
  export type Data = {
    title: string;
    body?: string | null;
    state: string;
    state_reason?: string | null;
    labels?: (string | { name?: string })[];
  };

  /** The REST fields a push may PATCH. */
  export type Patch = {
    title?: string;
    body?: string;
    state?: "open" | "closed";
    state_reason?: "completed" | "not_planned";
    labels?: string[];
  };

  /** Closed issues carry `completed` or `not_planned`; `duplicate` counts as the latter. */
  export function reason(value?: string | null) {
    if (!value || value === "completed" || value === "reopened") return "completed";
    return "not_planned";
  }

  /** A board column (or, failing that, the issue state) as a todo status. */
  export function status(column: string | null | undefined, state: string): Todo.Status {
    return (
      COLUMNS[column?.trim().toLowerCase() ?? ""] ??
      (state.toLowerCase() === "closed" ? "done" : "backlog")
    );
  }

  /** The local fields an issue carries, cut to what a todo can hold. */
  export function toTodo(issue: Data) {
    return {
      title: issue.title.slice(0, TITLE),
      body: issue.body ? issue.body.slice(0, BODY) : null,
      tags: labels(issue),
    };
  }

  /** What an issue changes locally — only the fields that differ, so an echo is a no-op. */
  export function diffInbound(todo: Todo.Info, issue: Data) {
    const next = toTodo(issue);
    const closed = issue.state === "closed";
    const why = reason(issue.state_reason);
    return {
      ...(next.title !== todo.title ? { title: next.title } : {}),
      ...((next.body ?? "") !== (todo.body ?? "") ? { body: next.body } : {}),
      ...(same(next.tags, todo.tags) ? {} : { tags: next.tags }),
      ...(closed && todo.status !== "done" ? { status: "done" as const, reason: why } : {}),
      ...(closed && todo.status === "done" && todo.reason !== why ? { reason: why } : {}),
      ...(!closed && todo.status === "done" ? { status: "planned" as const } : {}),
    };
  }

  /**
   * What GitHub should change for the local `keys` that moved — empty when it already holds
   * them. Limited to those keys so a stale todo never reverts an edit still in flight.
   */
  export function diffOutbound(todo: Todo.Info, issue: Data, keys: string[]): Patch {
    const remote = toTodo(issue);
    const when = (key: string, differs: boolean, patch: Patch) =>
      keys.includes(key) && differs ? patch : {};
    return {
      ...when("title", remote.title !== todo.title, { title: todo.title }),
      ...when("body", (remote.body ?? "") !== (todo.body ?? ""), { body: todo.body ?? "" }),
      ...when("tags", !same(remote.tags, todo.tags), { labels: todo.tags }),
      ...when("status", drifted(todo, issue), state(todo)),
    };
  }

  /** Deleting a todo closes its issue as not planned, unless it is already closed. */
  export function closeRemoved(issue: Data): Patch {
    if (issue.state === "closed") return {};
    return { state: "closed", state_reason: "not_planned" };
  }

  /** The sub-issue call that takes GitHub's parent from `have` to `want` (issue ids). */
  export function nesting(want: string | null, have: string | null) {
    if (want === have) return null;
    if (want) return "add" as const;
    return "remove" as const;
  }

  /** Sub-issues only nest within one owner, on either side. */
  export function sameOwner(a: Todo.Info, b: Todo.Info) {
    return a.source === b.source && a.sourceID === b.sourceID;
  }

  /** The live todo mirroring an issue id. */
  export async function find(id: number) {
    const [row] = await Database.use((tx) =>
      tx
        .select({ id: TodoTable.id })
        .from(TodoTable)
        .where(
          and(
            isNull(TodoTable.timeDeleted),
            sql`${TodoTable.metadata} -> 'annotations' ->> ${Annotation.Keys.id} = ${String(id)}`,
          ),
        ),
    );
    return row ? Todo.fromID(row.id) : null;
  }

  /** A todo for an issue, created and annotated in one transaction so a retry starts clean. */
  export function mirror(
    projectID: string,
    repo: string,
    data: Data & { id: number; number: number; status?: Todo.Status },
  ) {
    return Database.transaction(async () => {
      const status = data.status ?? (data.state === "closed" ? "done" : "backlog");
      const todo = await Todo.create({
        ...toTodo(data),
        source: "project",
        sourceID: projectID,
        status,
      });
      if (status === "done" && data.state === "closed")
        await Todo.update({ id: todo.id, reason: reason(data.state_reason) });
      return Actor.provide("system", {}, () =>
        Todo.annotate({
          id: todo.id,
          set: {
            [Annotation.Keys.issue]: `${repo}#${data.number}`,
            [Annotation.Keys.id]: String(data.id),
          },
        }),
      );
    });
  }

  // === UTILS ===

  /** Where the todo schema stops; a longer issue is held truncated and compared the same way. */
  const BODY = 20000;
  const TITLE = 2000;
  const TAGS = 20;

  /** Project v2 status columns by name. Anything else falls back to the issue's state. */
  const COLUMNS: Record<string, Todo.Status> = {
    backlog: "backlog",
    todo: "backlog",
    planned: "planned",
    ready: "planned",
    "in progress": "active",
    doing: "active",
    blocked: "blocked",
    done: "done",
    closed: "done",
  };

  function labels(issue: Data) {
    return clean(
      (issue.labels ?? []).map((label) =>
        (typeof label === "string" ? label : (label.name ?? "")).slice(0, 64),
      ),
    ).slice(0, TAGS);
  }

  /** Whether GitHub's open/closed (and close reason) disagrees with the todo's status. */
  function drifted(todo: Todo.Info, issue: Data) {
    if (todo.status !== "done") return issue.state !== "open";
    return issue.state !== "closed" || reason(issue.state_reason) !== reason(todo.reason);
  }

  /** The todo's status as GitHub's state fields. */
  function state(todo: Todo.Info): Patch {
    if (todo.status !== "done") return { state: "open" };
    return { state: "closed", state_reason: reason(todo.reason) };
  }

  function same(a: string[], b: string[]) {
    return [...a].sort().join("\n") === [...b].sort().join("\n");
  }
}
