<script lang="ts">
	import { createTable, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, Row, SortingState } from '@tanstack/svelte-table';
	import { Badge, DataTable, features } from '@template/ui';
	import { fmt } from '#lib/utils/fmt.ts';
	import { size } from '#lib/utils/size.ts';
	import type { getRegistry } from '../api/workspaces.remote';
	import { order } from '../sort';

	type Entry = Awaited<ReturnType<typeof getRegistry>>['rows'][number];
	type Cell = Row<typeof features, Entry>;

	let { rows }: { rows: Entry[] } = $props();

	const f = fmt();
	// Biggest first, as the server sends them; a header click reorders locally.
	let sorting = $state<SortingState>([{ id: 'size', desc: true }]);
	const keys: Record<string, (one: Entry) => string | number> = {
		slug: (one) => one.slug,
		members: (one) => one.members,
		size: (one) => one.bytes,
		created: (one) => one.timeCreated
	};
	const sorted = $derived(order(rows, sorting, keys));

	const cols: ColumnDef<typeof features, Entry>[] = [
		{
			id: 'slug',
			header: 'Slug',
			accessorFn: (one) => one.slug,
			cell: ({ row }) => renderSnippet(slug, row)
		},
		{ id: 'name', header: 'Name', accessorFn: (one) => one.name, enableSorting: false },
		{ id: 'schema', header: 'Schema', accessorFn: (one) => one.schema, enableSorting: false },
		{
			id: 'status',
			header: 'Status',
			accessorFn: (one) => one.status,
			enableSorting: false,
			cell: ({ row }) => renderSnippet(status, row)
		},
		{ id: 'members', header: 'Members', accessorFn: (one) => one.members },
		{
			id: 'size',
			header: 'Size',
			accessorFn: (one) => one.bytes,
			cell: ({ row }) => size(row.original.bytes)
		},
		{
			id: 'created',
			header: 'Created',
			accessorFn: (one) => one.timeCreated,
			cell: ({ row }) => f.date(row.original.timeCreated)
		}
	];

	const table = createTable({
		features,
		columns: cols,
		get data() {
			return sorted;
		},
		getRowId: (one) => one.id,
		state: {
			get sorting() {
				return sorting;
			}
		},
		onSortingChange: (next) => (sorting = typeof next === 'function' ? next(sorting) : next),
		manualSorting: true
	});
</script>

{#snippet slug(row: Cell)}
	<a href={`/settings/workspaces/${row.original.slug}`}>{row.original.slug}</a>
{/snippet}

{#snippet status(row: Cell)}
	<Badge tone={row.original.status === 'ready' ? 'done' : 'pending'}>{row.original.status}</Badge>
{/snippet}

<DataTable {table} empty="No workspaces yet." />

<style>
	a {
		font-family: var(--font-mono);
		font-weight: 500;
		color: inherit;
	}
</style>
