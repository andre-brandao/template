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
namespace instead (`Menu.Root`, `Menu.Item`) via `export * as`.

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
  only thing crossing the boundary is a token (`--border`, `--radius`), read bare as
  `var(--border)` with no fallback.

## Components

| Group    | Parts                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------- |
| Controls | `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `LazySelect`, `Toggle`                     |
| Choosers | `Combobox`, `Menu.*` (Root, Item, Label, Separator), `Tabs.*`, `Command`                          |
| Dates    | `Calendar`, `MonthGrid`, `DatePicker`, `RangePicker`                                              |
| Layers   | `Popover`, `Tooltip`, `Drawer`, `Modals` + `modal()` + `Dialog`, `Toaster` + `toast`              |
| Content  | `List.*` (Root, Row, Loading), `Card`, `Stat`, `Meter`, `Section`, `Field`, `Inline`, `DataTable` |
| States   | `Status`, `Spinner`, `Skeleton`, `Empty`, `Issue`, `FormBoundary`                                 |
| Text     | `Markdown`, `MarkdownEditor`, `Mermaid`, `Code`, `Kbd`, `Avatar`, `Badge`                         |
| Panes    | `Scroll`, `Fill`, `Full`                                                                          |

## Conventions

- **Tokens.** Every token has its light/dark default in `src/lib/tokens.css`
  (`@layer ui.tokens`, `:where(:root)`), which the app imports once and may override from
  its own `:root`. Components read `var(--x)` bare. Add a token there before using it.
- **One control height.** Buttons, inputs, selects, toggles and tabs read
  `var(--control)`; a toolbar lowers it by setting `--control` on its container.
- **One focus ring.** Boxed controls take `box-shadow: var(--ring)` with an accent border;
  borderless items (menu, tabs, list options) draw an inset 2px accent outline.
- **Buttons.** `Button` defaults to `secondary`; `variant="primary"` is for the one main action
  on a screen. An icon-only control is `IconButton`, whose `label` is required.
- **Status, not words.** Saving shows a `Status` dot or a button's `pending`, never "Saving…".
- **Saves return promises.** `Inline.onsave` gets `mutateAsync`, not `mutate`, so a rejection
  can revert and mark the field failed.
- **Dialogs** share `modal/dialog.ts`: an unlabelled one is named after its first heading.
- **Pickers.** `Combobox` and `Command` share `command/model.ts` (`step`, `bucket`, `mark`):
  focus stays in the search box and the arrows move `aria-activedescendant`.
- **Placement** of anything in the top layer goes through `popover/place.ts`.
- Callbacks: a DOM event keeps its DOM name (`onclick`); a picked value is `onchange`, a run
  action `onselect`.

## Commands

- `bun typecheck` — svelte-check
- `bun test` — testing-library auto-cleanup binds to the first importing file under bun,
  so cleanup hooks are registered from a preload. Keep it that way.

**No HMR.** Changes here need a `bun dev` restart in the consuming app; a stale scope hash
is the tell.
