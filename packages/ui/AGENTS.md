# @template/ui

Presentational Svelte 5 components. No app imports, no IO, no knowledge of core.

Use the Svelte MCP server (`list-sections` → `get-documentation` → `svelte-autofixer`)
before writing a component, and keep calling `svelte-autofixer` until it is quiet.

## Layout

One folder per component, holding everything about it:

```
src/lib/badge/
  Badge.svelte
  Badge.story.svelte    rendered by the dashboard's /dev/story harness
  Badge.test.ts
```

`input/` and `markdown/` group a family in one folder. A family of parts lands as a
namespace instead (`Combobox.Root`, `Combobox.Item`) via `export * as`.

Every component is re-exported from `src/lib/index.ts`, and every story is registered in
`src/lib/story.ts`. Adding a component means touching both.

## Rules

- **Encapsulate the library, inject the IO.** A component owns its third-party internals
  (Carta, mermaid, TanStack) so callers never import them. App concerns — uploading a file,
  fetching a row — arrive as props.
- **No core imports.** If a component needs a domain type, it takes a structural prop.
- Split a collection by destination (`{ top, bottom }`) rather than tagging items with a
  `bottom: true` modifier.
- CSS lives beside the component, scoped. Never lean on a class the app defines — the
  only thing crossing the boundary is a token (`--border`, `--radius`), and every one is
  written with a fallback so the component still reads on its own.

## Commands

- `bun typecheck` — svelte-check
- `bun test` — testing-library auto-cleanup binds to the first importing file under bun,
  so cleanup hooks are registered from a preload. Keep it that way.

**No HMR.** Changes here need a `bun dev` restart in the consuming app; a stale scope hash
is the tell.
