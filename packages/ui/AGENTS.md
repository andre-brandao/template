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

`input/`, `date/`, `markdown/` and `pane/` group a family in one folder. A family of parts lands as a
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

## Components

| Group    | Parts                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Controls | `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `LazySelect`, `Toggle`        |
| Choosers | `Combobox.*`, `Menu.*` (Root, Item, Label, Separator), `Tabs.*`, `Command`           |
| Dates    | `Calendar`, `MonthGrid`, `DatePicker`, `RangePicker`                                 |
| Layers   | `Popover`, `Tooltip`, `Drawer`, `Modals` + `modal()` + `Dialog`, `Toaster` + `toast` |
| Content  | `List.*` (Root, Row, Loading), `Card`, `Section`, `Field`, `Inline`, `DataTable`     |
| States   | `Status`, `Spinner`, `Skeleton`, `Empty`, `Issue`, `FormBoundary`                    |
| Text     | `Markdown`, `MarkdownEditor`, `Mermaid`, `Code`, `Kbd`, `Avatar`, `Badge`            |
| Panes    | `Scroll`, `Fill`, `Full`                                                             |

## Conventions

- **Tokens.** One fallback per token, matching the app's light theme: `--border #e6e5e1`,
  `--border-bright #d3d1cc`, `--surface #fff`, `--surface-2 #f2f1ee`, `--ink #1c1b19`,
  `--muted #64625d`, `--dim #75736d`, `--accent #2f7f68`, `--danger #b8452c`,
  `--hover rgb(0 0 0 / 0.06)`, `--radius 8px`, `--radius-sm 6px`. Don't invent a new one.
- **One control height.** Buttons, inputs, selects, toggles and tabs read
  `var(--control, 2.25em)`; a toolbar lowers it by setting `--control` on its container.
- **One focus ring.** Boxed controls take `box-shadow: var(--ring, …)` with an accent border;
  borderless items (menu, tabs, list options) draw an inset 2px accent outline.
- **Buttons.** `Button` defaults to `secondary`; `variant="primary"` is for the one main action
  on a screen. An icon-only control is `IconButton`, whose `label` is required.
- **Status, not words.** Saving shows a `Status` dot or a button's `pending`, never "Saving…".
- **Saves return promises.** `Inline.onsave` gets `mutateAsync`, not `mutate`, so a rejection
  can revert and mark the field failed.
- **Dialogs** share `modal/dialog.ts`: an unlabelled one is named after its first heading.
- **Placement** of anything in the top layer goes through `popover/place.ts`.
- Callbacks: a DOM event keeps its DOM name (`onclick`); a picked value is `onchange`, a run
  action `onselect`.

## Commands

- `bun typecheck` — svelte-check
- `bun test` — testing-library auto-cleanup binds to the first importing file under bun,
  so cleanup hooks are registered from a preload. Keep it that way.

**No HMR.** Changes here need a `bun dev` restart in the consuming app; a stale scope hash
is the tell.
