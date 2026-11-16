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
  (`@tanstack/markdown` and `highlight`, `beautiful-mermaid`, TanStack Table) so callers never
  import them. App concerns — uploading a file, fetching a row — arrive as props.
- **No core imports.** If a component needs a domain type, it takes a structural prop.
- Split a collection by destination (`{ top, bottom }`) rather than tagging items with a
  `bottom: true` modifier.
- CSS lives beside the component, scoped. Never lean on a class the app defines — the
  only thing crossing the boundary is a token (`--border`, `--radius`), read bare as
  `var(--border)` with no fallback.

## Components

| Group    | Parts                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| Controls | `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `LazySelect`, `Toggle`                                     |
| Choosers | `Combobox` (single or `multiple`), `Menu.*` (Root, Item, Label, Separator), `Tabs.*`, `Command`                   |
| Dates    | `Calendar`, `MonthGrid`, `DatePicker`, `RangePicker`                                                              |
| Layers   | `Popover`, `Tooltip`, `Drawer` (`side="bottom"` is a sheet), `Modals` + `modal()` + `Dialog`, `Toaster` + `toast` |
| Content  | `List.*` (Root, Row, Loading), `Card`, `Stat`, `Meter`, `Section`, `Field`, `Inline`, `DataTable`, `Pagination`   |
| States   | `Status`, `Spinner`, `Skeleton`, `Empty`, `Issue`, `FormBoundary`                                                 |
| Text     | `Markdown`, `MarkdownEditor`, `Mermaid`, `Code`, `Kbd`, `Avatar`, `Badge`                                         |
| Panes    | `Scroll`, `Fill`, `Full`                                                                                          |

## Conventions

- **Tokens.** Every token has its light/dark default in `src/lib/tokens.css`
  (`@layer ui.tokens`, `:where(:root)`), which the app imports once and may override from
  its own `:root`. Components read `var(--x)` bare. Add a token there before using it.
- **Feedback colours.** State reads from `--pending`, `--progress`, `--done`, `--danger` and
  `--info` (ideas, notices), plus `--accent`. `Badge`'s `tone` takes the same names (and
  `muted`), its text pulled toward `--ink` so every tone passes AA on its own wash.
- **One control height.** Buttons, inputs, selects, toggles and tabs read
  `var(--control)`; a toolbar lowers it by setting `--control` on its container.
- **One focus ring.** Boxed controls take `box-shadow: var(--ring)` with an accent border;
  borderless items (menu, tabs, list options) draw an inset 2px accent outline.
- **Buttons.** `Button` defaults to `secondary`; `variant="primary"` is for the one main action
  on a screen. An icon-only control is `IconButton`, whose `label` is required.
- **Status, not words.** Saving shows a `Status` dot or a button's `pending`, never "Saving…".
  Hand it the mutations (`<Status of={save} />`, `of={[save, drop]}`) instead of mapping
  `isPending`/`isError` by hand; `state`/`message` are for what isn't a mutation.
- **One announcer.** Dots carry no live region. A failed `Status` is read out once through the
  assertive region `Toaster` mounts (`toast/Announcer.svelte`); never add `aria-live` per row.
- **Inline cue.** An `Inline` face shows a faint pencil on hover or focus and a dotted underline
  on hover. Headers edit in place; rows open on click and rename from their menu.
- **Inline focus.** The face stays mounted until the input holds focus. A wrapper that closes
  on `focusout` must ignore focus moving inside it (`relatedTarget` within), or it closes as
  the editor opens.
- **DatePicker.** `presets` (`{ label, value }[]`, values in `date/parse.ts` syntax) render as
  a column beside the month and widen the popover. With `time`, the time input shows inline
  only once a time is set.
- **Saves return promises.** `Inline.onsave` gets `mutateAsync`, not `mutate`, so a rejection
  can revert and mark the field failed.
- **Dialogs** share `modal/dialog.ts`: an unlabelled one is named after its first heading.
- **Pickers.** `Combobox` and `Command` share `command/model.ts` (`step`, `bucket`, `mark`):
  focus stays in the search box and the arrows move `aria-activedescendant`. A `Combobox` is
  for open-ended lists (people, projects, records) or anything needing search; a small fixed
  set takes `Select` or `Tabs`. `multiple` binds `values: string[]` and keeps the panel open.
- **Placement** of anything in the top layer goes through `popover/place.ts`.
- Callbacks: a DOM event keeps its DOM name (`onclick`); a picked value is `onchange`, a run
  action `onselect`.

## Commands

- `bun typecheck` — svelte-check
- `bun test` — testing-library auto-cleanup binds to the first importing file under bun,
  so cleanup hooks are registered from a preload. Keep it that way.

**No HMR.** Changes here need a `bun dev` restart in the consuming app; a stale scope hash
is the tell.
