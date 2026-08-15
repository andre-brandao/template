<script module lang="ts">
	import type { Row } from '@tanstack/svelte-table';
	import type { Story } from '../story';
	import DataTable from './DataTable.svelte';
	import { features } from './table';

	type Crew = { name: string; craft: string; year: number | null };

	// A snippet in a file with a module script only sees module scope, so the cell type is
	// declared here rather than beside the columns.
	type Cell = Row<typeof features, Crew>;

	export const story: Story = {
		title: 'DataTable',
		blurb:
			'Renders the rows and cells itself from the column definitions; the caller supplies cells and the ordering. In the app that ordering is a Postgres ORDER BY — here it is a local toSorted.',
		of: DataTable
	};
</script>

<script lang="ts">
	import { createTable, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, ExpandedState, SortingState } from '@tanstack/svelte-table';

	const data: Crew[] = [
		{ name: 'Valentina Tereshkova', craft: 'Vostok 6', year: 1963 },
		{ name: 'Mae Jemison', craft: 'Endeavour', year: 1992 },
		{ name: 'Yuri Gagarin', craft: 'Vostok 1', year: 1961 },
		{ name: 'Someone Unflown', craft: '—', year: null }
	];

	const cols: ColumnDef<typeof features, Crew>[] = [
		{ id: 'name', header: 'Name', accessorFn: (one) => one.name, cell: ({ row }) => renderSnippet(name, row) },
		{ id: 'craft', header: 'Craft', accessorFn: (one) => one.craft, cell: ({ row }) => renderSnippet(craft, row) },
		{ id: 'year', header: 'Year', accessorFn: (one) => one.year, cell: ({ row }) => renderSnippet(year, row) },
		{ id: 'note', header: '', enableSorting: false, cell: ({ row }) => renderSnippet(note, row) }
	];

	let sorting = $state<SortingState>([{ id: 'year', desc: false }]);
	let expanded = $state<ExpandedState>({});

	// Stands in for the server: nulls last either way, matching core's `order()` helper.
	const rows = $derived.by(() => {
		const at = sorting[0];
		if (!at) return data;
		const key = at.id as keyof Crew;
		return data.toSorted((a, b) => {
			if (a[key] === b[key]) return 0;
			if (a[key] === null) return 1;
			if (b[key] === null) return -1;
			return (a[key]! < b[key]! ? -1 : 1) * (at.desc ? -1 : 1);
		});
	});

	const table = createTable({
		features,
		columns: cols,
		get data() {
			return rows;
		},
		getRowId: (one) => one.name,
		state: {
			get sorting() {
				return sorting;
			},
			get expanded() {
				return expanded;
			}
		},
		onSortingChange: (next) => (sorting = typeof next === 'function' ? next(sorting) : next),
		onExpandedChange: (next) => (expanded = typeof next === 'function' ? next(expanded) : next),
		getRowCanExpand: () => true,
		autoResetExpanded: false,
		manualSorting: true,
		maxMultiSortColCount: 3
	});
</script>

{#snippet name(row: Cell)}
	<strong>{row.original.name}</strong>
{/snippet}

{#snippet craft(row: Cell)}
	<span class="dim">{row.original.craft}</span>
{/snippet}

{#snippet year(row: Cell)}
	<span class="dim">{row.original.year ?? '—'}</span>
{/snippet}

{#snippet note(row: Cell)}
	<button type="button" class="more" onclick={row.getToggleExpandedHandler()}>
		{row.getIsExpanded() ? 'Hide' : 'Details'}
	</button>
{/snippet}

<DataTable {table} empty="No crew listed">
	{#snippet detail(row)}
		<p class="drawer">
			{row.original.name} flew aboard {row.original.craft}
			{row.original.year ? `in ${row.original.year}` : 'at no point at all'}.
		</p>
	{/snippet}
</DataTable>

<p class="note">
	Shift-click a second header to sort by two keys — the badges show priority. Only the first key
	is honoured here; core applies all of them.
</p>

<style>
	.dim {
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.8em;
	}

	.more {
		border: 0;
		background: none;
		font: inherit;
		font-size: 0.85em;
		color: var(--accent);
		cursor: pointer;
		padding: 0;
	}

	.drawer {
		margin: 0;
		padding: 0.9em;
		font-size: 0.9em;
		color: var(--muted);
	}

	.note {
		margin-top: 1em;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
