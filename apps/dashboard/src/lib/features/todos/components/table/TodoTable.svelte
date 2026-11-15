<script lang="ts">
	import { z } from 'zod';
	import { createTable, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, Row } from '@tanstack/svelte-table';
	import { goto } from '$app/navigation';
	import { DataTable, Menu, Status, features } from '@template/ui';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Todo } from '@template/core/todo';
	import { query } from '$lib/utils/params';
	import { peek } from '$lib/utils/peek';
	import { fmt } from '$lib/utils/fmt';
	import StatusPicker from '../StatusPicker.svelte';
	import TagList from '../TagList.svelte';
	import { late } from '../../status';
	import { move } from '../../api/todos.query';
	import Delete from '../Delete.svelte';
	import { moves, tree, visible, type Node } from '../../tree';
	import { sort } from '../../sort';

	let { todos }: { todos: Todo.Info[] } = $props();

	const f = fmt();

	// Collapsed parents. Rows are pre-flattened, so TanStack's expanding stays on `detail`.
	const closed = new SvelteSet<string>();
	const nodes = $derived(tree(todos));
	const rows = $derived(visible(nodes, closed));

	function toggle(id: string) {
		if (closed.has(id)) closed.delete(id);
		else closed.add(id);
	}

	const shift = move();

	const nest = (to: { id: string; parentID: string | null; position?: number }) =>
		shift.mutate({ path: { id: to.id }, body: { parentID: to.parentID, position: to.position } });

	const params = query(z.object({ sort: sort.schema }));

	// `params.update` navigates, and `page.url` only lands once that navigation — and the
	// `getTodos` it re-runs — has resolved. Reading sorting back off the URL would hand the
	// next click a pre-click value, and TanStack replaces rather than appends when the state
	// it is given is empty. Local state leads; the URL follows.
	// Writable derived: back and forward move the URL without passing through the toggle.
	let sorting = $derived(sort.decode(params.sort));

	// Cells render through snippets rather than a row component, so the column definition is
	// the single place a column's header, sort key and markup are declared together.
	type Cell = Row<typeof features, Node>;

	const cols: ColumnDef<typeof features, Node>[] = [
		{
			id: 'title',
			header: 'Title',
			// An accessor is what makes a column sortable (`getCanSort` requires one); the
			// ordering itself happens in Postgres, so nothing reads these values.
			accessorFn: (todo) => todo.title,
			cell: ({ row }) => renderSnippet(title, row)
		},
		{ id: 'stage', header: 'Stage', accessorFn: (todo) => todo.stage, cell: ({ row }) => renderSnippet(stage, row) },
		{
			id: 'assignee',
			header: 'Assignee',
			accessorFn: (todo) => todo.assignee?.name,
			cell: ({ row }) => renderSnippet(who, row)
		},
		{ id: 'dueDate', header: 'Due', accessorFn: (todo) => todo.dueDate, cell: ({ row }) => renderSnippet(due, row) },
		{ id: 'tags', header: 'Tags', enableSorting: false, cell: ({ row }) => renderSnippet(tags, row) },
		{
			id: 'status',
			header: 'Status',
			accessorFn: (todo) => todo.status,
			cell: ({ row }) => renderSnippet(status, row)
		},
		{ id: 'actions', header: '', enableSorting: false, cell: ({ row }) => renderSnippet(actions, row) }
	];

	const table = createTable({
		features,
		columns: cols,
		get data() {
			return rows;
		},
		getRowId: (todo) => todo.id,
		state: {
			get sorting() {
				return sorting;
			}
		},
		// The URL keeps a sorted table linkable and re-runs `getTodos` with the new keys.
		// Shift-click appends, up to core's cap of 3.
		onSortingChange: (next) => {
			sorting = typeof next === 'function' ? next(sorting) : next;
			params.update({ sort: sort.encode(sorting) });
		},
		manualSorting: true,
		maxMultiSortColCount: 3
	});
</script>

{#snippet title(row: Cell)}
	{@const node = row.original}
	<span class="tree" style="padding-left: {node.depth * 1.25}em">
		{#if node.total}
			<button
				class="chevron"
				class:open={!closed.has(node.id)}
				aria-expanded={!closed.has(node.id)}
				aria-label={closed.has(node.id) ? 'Expand sub-issues' : 'Collapse sub-issues'}
				onclick={() => toggle(node.id)}>▸</button
			>
		{:else}
			<span class="chevron"></span>
		{/if}
		<a class="title" href="/todos/{node.id}" onclick={peek({ selected: node.id })}>
			{node.title}
		</a>
		{#if node.total}
			<span class="dim">{node.done}/{node.total}</span>
		{/if}
		{#if shift.variables?.path.id === node.id}
			<Status state={shift.isPending ? 'pending' : shift.isError ? 'failed' : 'saved'} message={shift.error?.message} />
		{/if}
	</span>
{/snippet}

{#snippet stage(row: Cell)}
	<span class="dim">{row.original.stage ?? '—'}</span>
{/snippet}

{#snippet who(row: Cell)}
	<span class="dim">{row.original.assignee?.name ?? 'Unassigned'}</span>
{/snippet}

{#snippet due(row: Cell)}
	<span class="dim" class:late={late(row.original)}>
		{row.original.dueDate ? f.date(row.original.dueDate) : '—'}
	</span>
{/snippet}

{#snippet tags(row: Cell)}
	<TagList tags={row.original.tags} />
{/snippet}

{#snippet status(row: Cell)}
	<StatusPicker todo={row.original} />
{/snippet}

{#snippet actions(row: Cell)}
	{@const to = moves(nodes, row.original)}
	<Delete id={row.original.id} title={row.original.title}>
		{#snippet children(ask, deleting)}
			<Menu.Root label="{row.original.title} actions" align="end">
				{#snippet trigger(attrs)}
					<button class="dots" aria-label="{row.original.title} actions" {...attrs}>
						<Ellipsis size={16} strokeWidth={1.75} />
					</button>
				{/snippet}
				<Menu.Item onselect={() => goto(`/todos/${row.original.id}`)}>Open</Menu.Item>
				<Menu.Item
					disabled={!to.indent || shift.isPending}
					onselect={() => to.indent && nest(to.indent)}>Indent</Menu.Item
				>
				<Menu.Item
					disabled={!to.outdent || shift.isPending}
					onselect={() => to.outdent && nest(to.outdent)}>Outdent</Menu.Item
				>
				<Menu.Separator />
				<Menu.Item danger disabled={deleting} onselect={ask}>Delete</Menu.Item>
			</Menu.Root>
		{/snippet}
	</Delete>
{/snippet}

<DataTable {table} empty="No tasks yet" />

<style>
	.dim {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.dim.late {
		color: var(--danger);
	}

	.dots {
		display: grid;
		place-items: center;
		width: 1.9em;
		height: 1.9em;
		margin-left: auto;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.dots:hover,
	.dots[aria-expanded='true'] {
		background: var(--hover);
		color: var(--ink);
	}

	.title {
		color: var(--ink);
		text-decoration: none;
	}

	.tree {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
	}

	.chevron {
		width: 1.2em;
		flex: none;
		padding: 0;
		border: 0;
		background: none;
		color: var(--muted);
		cursor: pointer;
		transition: transform 120ms;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.title:hover {
		color: var(--accent);
	}
</style>
