<script lang="ts">
	import { z } from 'zod';
	import { createTable, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, Row } from '@tanstack/svelte-table';
	import { Button, DataTable, features } from '@template/ui';
	import type { Todo } from '@template/core/todo';
	import { query } from '$lib/utils/params';
	import { peek } from '$lib/utils/peek';
	import { fmt } from '$lib/utils/fmt';
	import StatusPicker from '../StatusPicker.svelte';
	import TagList from '../TagList.svelte';
	import { late } from '../../status';
	import { removeTodo } from '../../api/todos.remote';
	import { sort } from '../../sort';

	let { todos }: { todos: Todo.Info[] } = $props();

	const f = fmt();

	const params = query(z.object({ sort: sort.schema }));

	// `params.update` navigates, and `page.url` only lands once that navigation — and the
	// `getTodos` it re-runs — has resolved. Reading sorting back off the URL would hand the
	// next click a pre-click value, and TanStack replaces rather than appends when the state
	// it is given is empty. Local state leads; the URL follows.
	let sorting = $state(sort.decode(params.sort));

	// Back and forward move the URL without passing through the toggle.
	$effect(() => {
		sorting = sort.decode(params.sort);
	});

	// Cells render through snippets rather than a row component, so the column definition is
	// the single place a column's header, sort key and markup are declared together.
	type Cell = Row<typeof features, Todo.Info>;

	const cols: ColumnDef<typeof features, Todo.Info>[] = [
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
			return todos;
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
	<a class="title" href="/todos/{row.original.id}" onclick={peek({ selected: row.original.id })}>
		{row.original.title}
	</a>
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
	<StatusPicker todo={row.original} compact />
{/snippet}

{#snippet actions(row: Cell)}
	{@const remove = removeTodo.for(row.original.id)}
	<form class="acts" {...remove}>
		<input {...remove.fields.id.as('hidden', row.original.id)} />
		<Button variant="ghost" type="submit" pending={!!remove.pending}>Delete</Button>
	</form>
{/snippet}

<DataTable {table} empty="No tasks yet" />

<style>
	.dim {
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.8em;
		white-space: nowrap;
	}

	.dim.late {
		color: var(--danger);
	}

	.acts {
		display: flex;
		gap: 0.4em;
		justify-content: flex-end;
	}

	.title {
		color: var(--ink);
		text-decoration: none;
	}

	.title:hover {
		color: var(--accent);
	}
</style>
