<!-- One schema's disk use: the totals, then every table, sortable, its bar against the largest. -->
<script lang="ts">
	import { createTable, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, Row, SortingState } from '@tanstack/svelte-table';
	import { DataTable, Meter, Stat, features } from '@template/ui';
	import type { Workspaces } from '@template/core/workspaces';
	import { fmt } from '#lib/utils/fmt.ts';
	import { size } from '#lib/utils/size.ts';
	import { order } from '../sort';

	type Schema = Awaited<ReturnType<typeof Workspaces.usage>>[number];
	type Entry = Schema['breakdown'][number];
	type Cell = Row<typeof features, Entry>;

	let { usage }: { usage: Schema } = $props();

	const f = fmt();
	let sorting = $state<SortingState>([{ id: 'total', desc: true }]);
	const keys: Record<string, (one: Entry) => string | number> = {
		name: (one) => one.name,
		rows: (one) => one.rows,
		data: (one) => one.data,
		indexes: (one) => one.indexes,
		total: (one) => one.total
	};
	const sorted = $derived(order(usage.breakdown, sorting, keys));
	const widest = $derived(Math.max(...usage.breakdown.map((one) => one.total), 1));

	const cols: ColumnDef<typeof features, Entry>[] = [
		{ id: 'name', header: 'Table', accessorFn: (one) => one.name },
		{
			id: 'rows',
			header: 'Rows',
			accessorFn: (one) => one.rows,
			cell: ({ row }) => f.number(row.original.rows)
		},
		{
			id: 'data',
			header: 'Data',
			accessorFn: (one) => one.data,
			cell: ({ row }) => size(row.original.data)
		},
		{
			id: 'indexes',
			header: 'Indexes',
			accessorFn: (one) => one.indexes,
			cell: ({ row }) => size(row.original.indexes)
		},
		{
			id: 'total',
			header: 'Total',
			accessorFn: (one) => one.total,
			cell: ({ row }) => renderSnippet(total, row)
		}
	];

	const table = createTable({
		features,
		columns: cols,
		get data() {
			return sorted;
		},
		getRowId: (one) => one.name,
		state: {
			get sorting() {
				return sorting;
			}
		},
		onSortingChange: (next) => (sorting = typeof next === 'function' ? next(sorting) : next),
		manualSorting: true
	});
</script>

{#snippet total(row: Cell)}
	<span class="total">
		<span class="bar"><Meter value={row.original.total} max={widest} /></span>
		{size(row.original.total)}
	</span>
{/snippet}

<div class="stats">
	<Stat label="Size" value={size(usage.bytes)} />
	<Stat label="Tables" value={f.number(usage.tables)} />
	<Stat label="Rows" value={f.number(usage.rows)} note="estimated" />
</div>

<DataTable {table} empty="No tables yet." />

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75em;
		margin-bottom: 1em;
	}

	.total {
		display: flex;
		align-items: center;
		gap: 0.75em;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.bar {
		width: 6em;
	}

	@media (max-width: 40em) {
		.stats {
			grid-template-columns: 1fr;
		}

		.bar {
			display: none;
		}
	}
</style>
