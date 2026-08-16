# dashboard

SvelteKit 5 on :5173. Calls `@template/core` **directly** from remote functions — same
process, no HTTP hop. The SDK is for the CLI, not for this app.

TypeScript, Tailwind, bun. Svelte components: use the Svelte MCP server
(`list-sections` → `get-documentation` → `svelte-autofixer`) before writing, and keep
calling `svelte-autofixer` until it is quiet.

## Layout

```
src/lib/
  features/<slice>/        one vertical slice
    api/<slice>.remote.ts  remote functions — the only place core is called
    components/            slice-local components
    pages/                 whole-page components, rendered by a route
  components/layout/       shell, nav
  server/                  remote builder, auth, session, theme
src/routes/
  (app)/ (auth)/ admin/    route groups, each owning its own layout + nav links
  dev/                     story + prototype harnesses
```

Routes stay thin: a `+page.svelte` renders a page component from a slice. Each layout
declares its own nav links — no dispatcher branching on `route.id`.

## Remote functions

`$lib/server/remote` is a gate chain builder. Reach for the terminal that matches the job;
auth and `VisibleError` conversion come for free.

```ts
export const getTodos = remote.core(Todo.list); // schema + call, both from core
export const removeTodo = remote.can({ todo: ["delete"] }).command(schema, handler);
export const health = remote.public.query(schema, handler); // drops the auth gate
export const saveTodo = remote.form(schema, handler); // errors land as form issues
```

- `remote.core(fn)` is the default — it reuses core's schema, so there is no second
  definition to drift. `.with(schema)` swaps the input shape when a form needs one.
- The terminal decides error mode: `form` turns a `VisibleError` into a field issue,
  everything else throws a status the error page owns. Never pass the mode by hand.
- `can()` is role-level only. Ownership-scoped checks (`:own` grants) need the row, so they
  stay inside core.

## Rules

- **No cross-slice imports.** Routes compose slices via snippets; anything genuinely shared
  moves to a feature-wide slice (`events`, `sources`) or `lib/components`.
- **No context plumbing.** Join a foreign name into the query, or fetch it at the leaf —
  don't hand shared data down through Svelte context.
- **Await in markup**, inside the component's boundary. A conditional `$derived` in
  `<script>` that awaits a remote query fires before the boundary can catch it.
- **Guard `[id]` pages** with `{#if params.id}` — params are empty mid-navigation and will
  fire a remote query with `undefined`.
- **No global CSS.** `routes/layout.css` holds design tokens and the document reset,
  nothing else. A look shared by more than one screen becomes a component in
  `@template/ui` (`Field`, `Issue`, `Tabs`); a look used once stays scoped in the file
  that uses it. Scoped styles can't cross into a child, so pass a one-off layout tweak to
  a component as `style="..."` rather than reaching in with `:global`.
- `resolve()` breaks past ~30 routes; nav components cast untyped rather than fight it.

## Commands

- `bun typecheck` — svelte-check, from this directory. `e2e/` sits outside it by design.
- `bun test` — unit. `e2e/` needs a real Postgres and a running stack.

Edits to `packages/ui` need a `bun dev` restart; that package has no HMR, and a stale
scope hash is the tell.
