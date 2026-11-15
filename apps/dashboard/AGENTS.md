# dashboard

SvelteKit 5 on :5173. Calls `@template/core` **directly** from remote functions — same
process, no HTTP hop. From the one generated SDK it uses only the TanStack Query helpers, via
`@template/sdk/query` (an alias of the SDK barrel; below).

TypeScript, plain scoped CSS (no Tailwind), bun. Svelte components: use the Svelte MCP server
(`list-sections` → `get-documentation` → `svelte-autofixer`) before writing, and keep
calling `svelte-autofixer` until it is quiet.

## Layout

```
src/lib/
  features/<slice>/        one vertical slice
    api/<slice>.remote.ts  remote functions — the only place core is called
    api/<slice>.query.ts   TanStack query builders + mutation factories
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

## TanStack Query

Reference: `features/projects`. `$lib/query` owns the client; the `api` hook serves `/api/*` from the Hono router in-process.

- `api/<slice>.query.ts` holds query builders without opts (`list = (q) => getXOptions(...)`) and
  mutation factories that accept only `onSuccess`: `create({ onSuccess: (x) => goto(...) })`. No cache code in components.
- `meta: { invalidates: [key] }` takes query keys, partially matched: `getXQueryKey()` hits every list,
  `[{ tags: ["X"] }]` the whole resource. No meta invalidates everything. That cache-level pass always
  runs (and settles) before any `onSuccess`, so a component can't skip it.
- Precise update: the factory's own `onSuccess(data, vars, result, ctx)` calls `ctx.client.setQueryData(...)`.
- After a remote-function write, call `invalidate(key)` from `$lib/query`.
- Keep remote functions for internal-only data (no API route) and forms needing `enhance` or field issues.
- Internal/admin data (no API route, e.g. `developers` apps and webhooks) still uses TanStack: `queryFn` over remote functions with plain array keys (`["apps"]`); public resources use the SDK's `getXOptions`.
- SSR is opt-in per page with an inline `+page.ts` (let `content-type` through `filterSerializedResponseHeaders`):
  ``const data = await event.parent(); await data.queryClient.prefetchQuery(getXOptions({ baseUrl: `${event.url.origin}/api`, fetch: event.fetch, ... }))``
- App-wide providers (query client, shared contexts) live in `components/layout/ShellProvider.svelte`; a slice's context (`createAgent`) stays in the root layout.

## Palette and hotkeys

`routes/Palette.svelte` is the ⌘K palette. It reads only memory when it opens: no request.

- **Nav** comes from data that already exists: the current layout's `nav`, plus `home` and
  `account()` from `components/layout/nav.ts`. A new section shows up once its layout returns `nav`.
- **An app-wide action** is one entry in `actions` there. Routes may import slices, so it raises a
  slice's own form (`run: () => modal(ProjectForm)`); gate it with `me.can(...)`.
- **A page action** is a hotkey, not a palette entry. Declare it once in `$lib/hotkeys.ts` (with
  `meta.name` and `meta.group`), then bind it where the page mounts:
  `createHotkey(hotkeys.create, add)`. The `?` sheet lists every declared key, dimming the ones
  this page doesn't bind. Reuse `create` (`C`) and `search` (`/`) before declaring a new key.
- Open modals and the palette hold exclusive scopes, so page keys never fire behind them.

## Rules

- **No cross-slice imports.** Routes compose slices via snippets; anything genuinely shared
  moves to a feature-wide slice (`events`, `sources`) or `lib/components`.
- **No context plumbing.** Join a foreign name into the query, or fetch it at the leaf —
  don't hand shared data down through Svelte context.
- **Await in markup**, inside the component's boundary. A conditional `$derived` in
  `<script>` that awaits a remote query fires before the boundary can catch it.
- **Guard `[id]` pages** with `{#if params.id}` — params are empty mid-navigation and will
  fire a remote query with `undefined`.
- **No global CSS.** `routes/layout.css` imports `@template/ui/tokens.css` and holds
  the app-only tokens (charts, shell frame) and the document reset, nothing else. A look shared by more than one screen becomes a component in
  `@template/ui` (`Field`, `Issue`, `Tabs`); a look used once stays scoped in the file
  that uses it. Scoped styles can't cross into a child, so pass a one-off layout tweak to
  a component as `style="..."` rather than reaching in with `:global`.
- `resolve()` breaks past ~30 routes; nav components cast untyped rather than fight it.

## Commands

- `bun typecheck` — svelte-check, from this directory. `e2e/` sits outside it by design.
- `bun test` — unit. `e2e/` needs a real Postgres and a running stack.

Edits to `packages/ui` need a `bun dev` restart; that package has no HMR, and a stale
scope hash is the tell.
