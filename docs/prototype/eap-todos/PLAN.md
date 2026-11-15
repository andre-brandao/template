---
title: EAP todos — technical plan
date: 2026-11-15
---

# EAP todos — technical plan

This is the technical companion to [PROTOTYPE.md](./PROTOTYPE.md). It follows the order set in
P1 of `docs/proposals/2026-11-15-review.md`. Each phase is one PR, stacked on the one before.
The user runs migrations (`bun run db:generate`) and SDK generation (`bun run gen`); this plan
only lists them.

| PR  | Phase                   | Review item | Migration               | Gen | Size |
| --- | ----------------------- | ----------- | ----------------------- | --- | ---- |
| 1   | Tree read with roll-ups | P1a         | none                    | yes | M    |
| 2   | Weight and parent dates | P1d + P1e   | `todo.weight`           | yes | S    |
| 3   | Outline view            | P1b         | none                    | no  | M    |
| 4   | Dependencies and Gantt  | P1c         | `todo_dependency` table | yes | L    |
| 5   | Baselines               | P1f         | `todo_baseline` table   | yes | M    |

PR 3 is UI only and can be built in parallel with PR 4 and PR 5, or after them, if U6 (the
keyboard model) is not ready yet.

**Where the code goes.** Everything stays inside the existing todo slice. The plan adds no new
slice and no new permission resource.

- **`packages/core/src/todo/`**
  - `todo.sql.ts`: gains the new tables
  - `index.ts`: gains `Todo.tree` and `weight`
  - `tree.ts`: new, the pure roll-up pass
  - `dependency.ts`: new, the `Dependency` namespace
  - `baseline.ts`: new, the `Baseline` namespace
  - Both new namespaces are re-exported from `index.ts`, the way `Insights` is.
- **`packages/functions/src/api/handler/todo.ts`**: new routes. Each one is registered before
  `/:id`, as `/stage` is today.
- **`packages/functions/src/mcp/tool/todo.ts`**: new tools.
- **`apps/dashboard/src/lib/features/todos/`**
  - `api/todos.query.ts`: new options and mutations
  - `tree.ts`: keeps `visible`/`moves` and gains `matches`
  - `components/outline/`: new
  - `components/timeline/`: gains arrows, summary bars and ghost bars
  - `components/Baselines.svelte`: new
  - `components/Dependencies.svelte`: new

---

## PR 1: Tree read with roll-ups (P1a)

### Core

`Todo.tree` covers one owner (`source`, `sourceID`). It returns every live todo in that owner
in outline order, with the derived fields filled in. The query has two steps:

1. A recursive CTE walks the tree and yields `(id, path)`.
2. A typed drizzle select joins those ids back, so the existing `serialize()` and assignee join
   are reused.

```ts
// packages/core/src/todo/index.ts
export const Node = Info.omit({ body: true })
  .extend({
    depth: z.number().int().meta({ description: "0 at the top level." }),
    code: z.string().meta({ description: "WBS code like `2.3.1`, derived from positions." }),
    total: z.number().int().meta({ description: "Todos beneath it, at any depth." }),
    done: z.number().int().meta({ description: "Of those, how many are done." }),
    progress: z.number().min(0).max(1).meta({ description: "Weighted, see `weight`." }),
    span: z.object({
      start: z.iso.datetime().nullable(),
      end: z.iso.datetime().nullable(),
      derived: z.boolean().meta({ description: "True when taken from its sub-issues." }),
    }),
    warnings: z.array(z.enum(["late", "conflict"])).meta({
      description:
        "`late`: ends after its parent's due. `conflict`: starts before a predecessor is due.",
    }),
  })
  .meta({ ref: "TodoNode" });

export const tree = fn(
  z.object({ source: Info.shape.source.unwrap(), sourceID: Info.shape.sourceID.unwrap() }),
  async (input) => {
    Identity.check({ todo: ["read"] });
    const rows = await Database.use(async (tx) => {
      const walk = await tx.execute<{ id: string; path: number[] }>(sql`
        with recursive walk as (
          select id, array[position] as path from ${TodoTable}
          where source = ${input.source} and source_id = ${input.sourceID}
            and parent_id is null and time_deleted is null
          union all
          select c.id, w.path || c.position from ${TodoTable} c
          join walk w on c.parent_id = w.id where c.time_deleted is null
        )
        select id, path from walk order by path limit ${cap + 1}`);
      // ...cap check, then select { todo, user } where id in walk ids
    });
    return roll(rows); // ./tree.ts
  },
  {
    title: "Todo tree",
    description: "Every todo an entity owns, in outline order, with roll-ups.",
  },
);
```

`roll()` in `todo/tree.ts` is a pure function and makes one pass from the bottom of the tree to
the top.

- `code` is `path.map((p) => p + 1).join(".")`. This works because positions are dense from 0.
- `total` and `done` count every todo beneath a node, at any depth.
- `span`: a node with no dates of its own takes the earliest start and the latest due among its
  children (a child's start falls back to its due), and `derived` is true.
- Until PR 2 adds weights, `progress` is `done / total`.

Because `body` is omitted, a 2,000-node tree stays around 1 MB of JSON. The detail page still
reads the body through `fromID`.

`cap` is 5,000 rows. A project with more gets
`VisibleError("validation", …, "Too many todos for the tree view")` and not a truncated tree.
A truncated tree would make every roll-up wrong without any sign of it.

### API, SDK and MCP

| Surface | Name / route                                   | Notes                                                                    |
| ------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| API     | `GET /todo/tree?source&sourceID` → `{ nodes }` | It returns an object, so PR 4 can add `dependencies` without breaking it |
| SDK     | `getTodoTree` / `getTodoTreeOptions`           | Comes from `bun run gen`                                                 |
| MCP     | `read("todo_tree", Todo.tree)`                 | A read-only hint                                                         |

### Dashboard

- **`todos.query.ts`**: add `tree(scope, ctx)`, which returns `getTodoTreeOptions` with
  `placeholderData: keepPreviousData`. It carries the `Todo` tag, so the existing `todo`
  invalidation list already refreshes it. Add `getTodoTreeQueryKey()` to `move`'s invalidation
  list.
- **`board(url, scope)`**: with a project scope, every view except the calendar warms `tree(scope)`
  and not `list(...)`. The unscoped `/todos` home keeps `list` and the client-side `tree()`.
- **`tree.ts`**: the client roll-up in `tree()` stays only for the unscoped list. Add
  `matches(nodes, keep)`, which keeps the matching nodes plus their ancestors and marks the
  ancestors `context` so they render dimmed. The status, assignee, stage and search filters run
  through it on the client.
- **`TodoTable`**: on the project page it reads `Node[]` straight from the tree.
  `total`/`done` now come from the server. Indent and outdent keep calling `moves()`.

### Cleanup on the way

`ancestors()` in `todo/index.ts` runs one query per level. It becomes one recursive CTE. This is
optional.

---

## PR 2: Weight and parent dates (P1d + P1e)

### Schema

```ts
// packages/core/src/todo/todo.sql.ts (inside TodoTable)
// Share of its parent's progress. 0 makes a milestone: counted, but it adds nothing.
weight: integer().notNull().default(1),
```

```sql
-- migration 1 (the user runs db:generate)
ALTER TABLE "todo" ADD COLUMN "weight" integer DEFAULT 1 NOT NULL;
```

### Core

- `Info` gains `weight: z.number().int().min(0).max(100)`, and `weight` is added to `Patch`
  and `create`. It goes through `update` and the existing `todo.updated` diff, so it needs no new
  event.
- **`roll()` progress.** A leaf scores 1 when done and 0 otherwise. A parent scores
  `Σ(weight·progress) / Σ weight` over its children. A child that is done with
  `reason = 'not_planned'` is left out of the sum. If the sum of weights is 0, the parent falls
  back to the count ratio.
- **`roll()` warnings.** `late` is set when a child's `span.end` is later than its parent's own
  `dueDate`. A derived span is never compared, because it can't be late against itself.

### UI

- The weight goes in the editor's field list (`fields.ts`) and in the table as a column that is
  hidden by default.
- The table's title cell shows a thin progress bar beside the `done/total` text.
- A derived span is shown in italics, with the tooltip "from sub-issues".

### MCP

Nothing new is needed. `todo_update` picks up `weight` from the schema.

---

## PR 3: Outline view (P1b)

This PR is UI only. It reads `tree(scope)` from PR 1 and writes through the existing `update`,
`create`, `move` and `remove`.

- **View option.** `filter.ts`: `view: z.enum([..., "outline"])`. Add the option to
  `ViewSelector`, and add a branch in `TodosView`.
- **`components/outline/OutlineView.svelte` and `Row.svelte`.**
  - The list uses roving focus. When U6 lands, it moves onto `List.Root`.
  - The keys are the ones in PROTOTYPE.md.
  - The row component handles `keydown` itself. The page-level `createHotkey` still owns `C`
    and `/`.
- **Pending edits.** Each key press calls a mutation. While it runs, the outline keeps a local
  overlay `{ id → parentID, position }` and draws the rows from it. When the refetched tree
  arrives, the overlay entry is dropped. The query cache is never written ahead of the server
  (the `Inline` rule). If the call fails, the overlay entry is dropped and the row's `Status`
  dot shows the failure.
- **Enter** calls `create({ parentID, title: "" })` and then `move` to the slot below.
  `create` places a new todo last, so it takes two calls.

> [!NOTE]
> `Todo.create` could take an optional `position` so Enter becomes one call. That is a small,
> additive core change, and it is recommended in this PR.

---

## PR 4: Dependencies and Gantt (P1c)

### Schema

```ts
// packages/core/src/todo/todo.sql.ts
export const DependencyTypes = ["fs"] as const;

// `from` must finish before `to` starts. Same owner only, no loops; both checked in core.
export const DependencyTable = snakeCase.table(
  "todo_dependency",
  {
    id: id(),
    ...timestamps,
    fromID: ulid().notNull(),
    toID: ulid().notNull(),
    type: text({ enum: DependencyTypes }).notNull().default("fs"),
    // Days after `from` is due; negative overlaps. Stored now, not in the UI yet.
    lag: integer().notNull().default(0),
  },
  (table) => [
    uniqueIndex("todo_dependency_pair").on(table.fromID, table.toID),
    index("todo_dependency_to").on(table.toID),
  ],
);
```

```sql
-- migration 2
CREATE TABLE "todo_dependency" (
  "id" char(30) NOT NULL,
  "time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "time_deleted" timestamp(3) with time zone,
  "from_id" char(30) NOT NULL,
  "to_id" char(30) NOT NULL,
  "type" text DEFAULT 'fs' NOT NULL,
  "lag" integer DEFAULT 0 NOT NULL
);
CREATE UNIQUE INDEX "todo_dependency_pair" ON "todo_dependency" ("from_id","to_id");
CREATE INDEX "todo_dependency_to" ON "todo_dependency" ("to_id");
```

Links are hard-deleted, so `time_deleted` stays null. It is there only because every table
spreads `timestamps`. The table has no foreign keys, following the repo's convention. Core
deletes a todo's links inside `Todo.remove`'s transaction.

Add `Identifier.prefixes.dependency = "dep"`.

### Core: `todo/dependency.ts`

```ts
export namespace Dependency {
  export const Info = z.object({ id, fromID, toID, type, lag }).meta({ ref: "TodoDependency" });

  export const add = fn(
    z.object({ fromID, toID, lag: Info.shape.lag.optional() }),
    async (input) => {
      const [from, to] = await Promise.all([Todo.fromID(input.fromID), Todo.fromID(input.toID)]);
      Identity.check({ todo: ["update"] }, to.createdBy);
      // the same owner; not self; neither an ancestor of the other; no loop (CTE below)
      // pg_advisory_xact_lock(hashtext(sourceID)) so two concurrent adds can't close a loop
      // upsert on (from_id, to_id); publish Todo.Event.Updated on `to` with changes.dependencies
    },
  );

  export const remove = fn(z.object({ fromID, toID }) /* … */);
}
```

```sql
-- loop check: is `from` reachable from `to`?
with recursive reach(id) as (
  select to_id from todo_dependency where from_id = $to
  union
  select d.to_id from todo_dependency d join reach r on d.from_id = r.id
)
select 1 from reach where id = $from limit 1;
```

The loop error names the path. The CTE collects `array[...]` paths so the message can read
"Would create a loop: Go-live → QA pass → …".

`Todo.tree` returns `{ nodes, dependencies }`. The edges come from one select,
`where from_id = any($ids)`. `roll()` sets `conflict` when a successor's `span.start` is earlier
than its predecessor's `span.end + lag`. A parent can be either end of a link; its span is the
derived one.

### API, SDK and MCP

| Surface | Name / route                                                                         |
| ------- | ------------------------------------------------------------------------------------ |
| API     | `POST /todo/dependency` `{ fromID, toID, lag? }` → `TodoDependency`                  |
| API     | `DELETE /todo/dependency?fromID&toID` → 204                                          |
| MCP     | `tool("todo_depend", Dependency.add)` and `tool("todo_undepend", Dependency.remove)` |

### UI

- **`components/timeline/`**
  - With a project scope, the rows come from `tree(scope)`, indented by depth.
  - A parent draws a summary bracket. It is dashed when the span is derived.
  - `Arrows.svelte` is a single SVG overlay with elbow paths drawn from the row and bar
    geometry the timeline already computes.
  - Hovering a bar highlights its links, and clicking an arrow opens a popover with a Remove
    button.
  - An "Add dependency" toggle switches to click-predecessor-then-successor mode.
  - The "Shift after predecessor" button on a conflict calls the plain `update` with new dates.
- **`components/Dependencies.svelte`** goes on the detail page. It is a "Blocked by" list with
  a `Pick` picker. Its options come from the existing `list({ source, sourceID, search })`,
  following the server-side options rule; no new op is needed.
- **`todos.query.ts`**: `depend()` and `undepend()` mutations, which invalidate `todo`.

---

## PR 5: Baselines (P1f)

### Schema

```ts
// packages/core/src/todo/todo.sql.ts
export type Snapshot = {
  id: string;
  title: string;
  start: string | null;
  due: string | null;
  weight: number;
}[];

// A frozen plan: written once, never edited, so variance has something fixed to measure against.
export const BaselineTable = snakeCase.table(
  "todo_baseline",
  {
    id: id(),
    ...timestamps,
    createdBy: ulid().notNull(),
    source: text().notNull(),
    sourceID: ulid().notNull(),
    name: text().notNull(),
    snapshot: jsonb().$type<Snapshot>().notNull(),
  },
  (table) => [index("todo_baseline_source").on(table.source, table.sourceID, table.timeCreated)],
);
```

```sql
-- migration 3
CREATE TABLE "todo_baseline" (
  "id" char(30) NOT NULL,
  "time_created" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "time_updated" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "time_deleted" timestamp(3) with time zone,
  "created_by" char(30) NOT NULL,
  "source" text NOT NULL,
  "source_id" char(30) NOT NULL,
  "name" text NOT NULL,
  "snapshot" jsonb NOT NULL
);
CREATE INDEX "todo_baseline_source" ON "todo_baseline" ("source","source_id","time_created");
```

Add `Identifier.prefixes.baseline = "bsl"`.

### Core: `todo/baseline.ts`

| Op                                            | Check         | Returns                                                                                                                      |
| --------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Baseline.create({ source, sourceID, name })` | `todo:update` | `Info`. It snapshots `Todo.tree`, using each node's `span`, so a parent is saved with its derived span                       |
| `Baseline.list({ source, sourceID })`         | `todo:read`   | `Info[]`, newest first, without `snapshot`: `{ id, name, createdBy, timeCreated, count }`. This is also the picker's options |
| `Baseline.compare({ id })`                    | `todo:read`   | `{ baseline: Info, rows: { id, title, base: Span \| null, now: Span \| null, days: number \| null }[] }`                     |
| `Baseline.remove(id)`                         | `todo:update` | A soft delete                                                                                                                |

In `compare`, a todo deleted since the snapshot has `now: null`, and a todo added since has
`base: null`. `days` is the number of calendar days from the baseline due to the current due,
counted in the reader's zone from prefs. One op serves the UI's ghost bars and the agent's
"what slipped".

### API, SDK and MCP

| Surface | Name / route                                                                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| API     | `GET /todo/baseline?source&sourceID` and `POST /todo/baseline`                                                                               |
| API     | `GET /todo/baseline/{id}/compare` and `DELETE /todo/baseline/{id}`                                                                           |
| MCP     | `read("todo_baselines", Baseline.list)`, `read("todo_baseline_compare", Baseline.compare)` and `tool("todo_baseline_save", Baseline.create)` |

### UI

- **`components/Baselines.svelte`** is a picker plus a "Save baseline" dialog. It sits in the
  timeline toolbar, and the selection lives in the URL as `?baseline=bsl_…`.
- **Timeline `Row`** draws a ghost bar from `compare`'s `base`. The variance column shows
  `days`, or a `new` or `removed` badge. Removed todos render as struck-through ghost rows in
  their old place, under their snapshot parent when that parent still exists and at the end
  otherwise.
- **Summary strip and "Only changes"** are computed on the client from `rows`. "Only changes"
  keeps ancestors through `matches()`.
- **Warming.** `+page.ts` warms `compare` when the URL carries `baseline`.

---

## Performance

**How the tree is read.** The options weighed:

| Option                                  | Read                                                                         | Write on move                            | Migration         |
| --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- | ----------------- |
| **Recursive CTE (chosen)**              | One query, using the `todo_parent (parent_id, position)` index at each level | None beyond today's sibling renumber     | None              |
| Materialized path (`path text`/`ltree`) | One index range scan                                                         | Rewrites the whole moved subtree         | Yes               |
| Closure table                           | One join                                                                     | Deletes and inserts depth × subtree rows | Yes, plus a table |

Every view reads the whole project, so the CTE's cost is close to a plain scan. The CTE is the
choice, as the review recommended. A project of 5,000 todos with a depth of about 6 means about
6 index-driven iterations.

- **Roll-ups** are computed in TypeScript, in `roll()`. It is one O(n) pass from the bottom up
  over rows that are already ordered. Nothing is stored or cached on the server, so nothing can
  drift.
- **Caching** comes from TanStack Query, keyed by scope and tagged `Todo`. Every todo mutation
  already invalidates that tag, so the tree refetches once for each edit. If that ever shows up
  in profiles, there are two remedies:
  - keep the tree in `kv`, keyed by `(scope, max(time_updated))`
  - narrow the invalidation for outline moves
    Neither is part of this plan.
- **Writes** don't change, apart from the loop check, which is one CTE over the dependency
  edges and is bounded by the size of the project.
- **Baseline `compare`** reads one jsonb row and one tree. A snapshot of 5,000 todos is about
  400 KB of jsonb, which is acceptable.

## Risks

- **Many refetches during outline editing.** `Todo.move` updates each sibling in a loop, and
  every key press refetches the whole tree. The pending overlay hides the delay. If moves get
  slow, `move` can renumber in one `UPDATE … FROM (VALUES …)`.
- **A different filter model on project pages.** Filters move to the client and keep
  ancestors. A deep link with `?status=done` now also shows the done todos' open parents,
  dimmed.
- **The tree cap.** Above 5,000 todos the project views fail loudly. No project is near that,
  but it is a hard edge.
- **Loop-check races.** The advisory lock covers Postgres. pglite runs one connection, so it is
  serial anyway.
- **Hono route order.** `/tree`, `/dependency` and `/baseline` must be registered before
  `/:id`.
- **Day maths and time zones.** Variance and "Shift after predecessor" count calendar days in
  the reader's zone, and Node's ICU has no UTC shortcut (see memory). Reuse `today(zone(prefs))`
  from `@template/ui/day`.
- **The SDK changes shape in PR 1.** `getTodoTree` returns `{ nodes }`, so later phases only
  add fields. The `bun run gen` diffs stay additive.
- **The timeline rewrite is the biggest UI change.** Arrows depend on stable row geometry.
  Keep using the existing HTML bars; don't move to layerchart, because of the 2.0.0-next bugs.

## Open questions

> [!NOTE]
> **1. Should all project-scoped views read the tree?** Recommended: yes. Table, board,
> timeline, outline and list all share `tree(scope)`, so the counts are right everywhere. The
> calendar keeps its date window, and the cross-project `/todos` keeps the paged `list`.

> [!NOTE]
> **2. Should the outline wait for U6?** Recommended: build PR 3 after U6, as the review says,
> and ship PR 4 and PR 5 first if U6 slips. The outline's row component is the one place that
> would otherwise need its own roving focus.

> [!NOTE]
> **3. Should dependency `lag` exist now?** Recommended: store the column with default 0 and
> leave it out of the UI and the MCP description for now. Adding it later would cost a second
> migration.

> [!NOTE]
> **4. Can parents be linked?** Recommended: yes, between any two todos in the same owner,
> except along an ancestor chain. A leaves-only rule, as fpe-erp has, breaks the moment a leaf
> is indented under something.

> [!NOTE]
> **5. Should successors move automatically?** Recommended: no. Show a warning and an explicit
> "Shift after predecessor" button. fpe-erp's push-only cascade can be added later as an opt-in
> action.

> [!NOTE]
> **6. What weight range, and should milestones be a type?** Recommended: integers 0–100, with
> 0 meaning a milestone. There is no `kind` column; a milestone is recognised by having weight
> 0 and only a due date.

> [!NOTE]
> **7. Does `not_planned` count towards progress?** Recommended: no. A todo dropped as not
> planned leaves the denominator, so dropping scope doesn't stall a parent at 80%.

> [!NOTE]
> **8. Where are baselines stored?** Recommended: a `todo_baseline` table with a jsonb
> snapshot. fpe-erp keeps JSON files in object storage, which has no conditional writes and
> needs a second lookup. A table keeps it to one query and lets a transaction own it.

> [!NOTE]
> **9. Do baselines need their own permission?** Recommended: no. Reuse `todo:read` and
> `todo:update`. Add a `baseline` resource only if members should not freeze plans.

> [!NOTE]
> **10. How are links deleted?** Recommended: hard delete, inside `Todo.remove`'s transaction
> for the todo's own links. Restoring a link has no use, and the `todo.updated` event already
> records the change.

> [!NOTE]
> **11. Should `create` take a position?** Recommended: yes, an optional `position` on
> `Todo.create`, added in PR 3, so the outline's Enter key is one call.
