# Page layout: header, filter row, content

Every page opens with `Header.Root`. Filters live **inside** it, on the `strip` band, inline on
one row that wraps on narrow screens. Never stack full-width inputs or selects above a list.

```
Header.Root   title · one-line lead · actions (right)
  facts       Header.Item …             optional, counts and key figures
  strip       Header.Group …            search, selects, toggles; `end` group for Clear
content       table / list / sections
```

## Components

`import * as Header from '$lib/components/header';`

| Part           | Props                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Header.Root`  | `title: string \| Snippet`, `eyebrow?: string \| Snippet` (parent link), `lead?: string \| Snippet`, `actions?: Snippet`, `strip?: Snippet` (filter row), `children?` (facts) |
| `Header.Item`  | `label: string`, children = value. One fact on the facts band.                                                                                                                |
| `Header.Group` | `label?: string` (muted caption), `end?: boolean` (push right), children.                                                                                                     |

From `@template/ui`: `Input type="search"`, `Select`/`LazySelect`, `Toggle` (on/off chip),
`Button variant="ghost"` for "Clear filters", `RangePicker` for dates.

## Rules

- **Lead is one short line** (under ~70 chars). Cut the essay; move detail to docs or an empty
  state. Omit it when the title says enough.
- **Primary action** (`New x`) goes in `actions`, not on the filter row.
- **Filters go in `strip`**, one `Header.Group` per control. Search first (it grows to fill the
  line); then selects with a `label`; toggles; then `<Header.Group end>` with Clear filters,
  shown only while a filter is on.
- Don't size controls: the strip makes selects fit their words, search flex, and every control
  2rem tall. Give each control an `aria-label` (the visible group label is `aria-hidden`).
- Counts or key figures (`Entries 264`) go as `Header.Item` children, not in the lead.
- No wrapper `div.bar`/`div.toolbar` around filters and no page CSS for them.
- A list that scrolls in place: wrap the page in `Fill`, put the table in `Scroll fill`.

## Example

The reference is `features/admin/pages/LogsPage.svelte`.

```svelte
<Fill>
	<Header.Root title="Logs" lead="Every audit entry, newest first.">
		<Header.Item label="Entries">{log.total.toLocaleString()}</Header.Item>
		{#snippet actions()}<Button onclick={add}>New thing</Button>{/snippet}
		{#snippet strip()}
			<Header.Group>
				<Input type="search" aria-label="Search" placeholder="Search…" oninput={...} />
			</Header.Group>
			<Header.Group label="Type">
				<Select aria-label="Type" options={types} value={params.type} onchange={...} />
			</Header.Group>
			<Header.Group label="User">
				<Toggle pressed={mine} onclick={(on) => pick({ mine: on })}>Only mine</Toggle>
			</Header.Group>
			{#if filtered}
				<Header.Group end>
					<Button variant="ghost" onclick={clear}>Clear filters</Button>
				</Header.Group>
			{/if}
		{/snippet}
	</Header.Root>

	<Scroll fill><Table … /></Scroll>
	<Pagination of={log} … />
</Fill>
```
