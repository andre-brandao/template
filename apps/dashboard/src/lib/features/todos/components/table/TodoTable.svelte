<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import TableRow from './TableRow.svelte';
	import { STATUSES } from '../../status';

	let { todos }: { todos: Todo.Info[] } = $props();

	type Key = 'title' | 'stage' | 'assignee' | 'due' | 'status';

	let key = $state<Key | null>(null);
	let asc = $state(true);

	const value = (todo: Todo.Info, k: Key) => {
		if (k === 'title') return todo.title.toLowerCase();
		if (k === 'stage') return todo.stage?.toLowerCase() ?? null;
		if (k === 'assignee') return todo.assignee?.name.toLowerCase() ?? null;
		if (k === 'due') return todo.dueDate;
		return STATUSES.indexOf(todo.status);
	};

	const sorted = $derived.by(() => {
		const k = key;
		if (!k) return todos;
		return todos.toSorted((a, b) => {
			const x = value(a, k);
			const y = value(b, k);
			if (x === y) return 0;
			if (x === null) return 1;
			if (y === null) return -1;
			return (x < y ? -1 : 1) * (asc ? 1 : -1);
		});
	});

	function sort(next: Key) {
		asc = key === next ? !asc : true;
		key = next;
	}

	const dir = $derived(asc ? 'ascending' : 'descending');
	const arrow = $derived(asc ? '↑' : '↓');
</script>

{#snippet head(k: Key, text: string)}
	<th aria-sort={key === k ? dir : undefined}>
		<button type="button" onclick={() => sort(k)}>
			{text}<span class="arrow">{key === k ? arrow : ''}</span>
		</button>
	</th>
{/snippet}

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				{@render head('title', 'Title')}
				{@render head('stage', 'Stage')}
				{@render head('assignee', 'Assignee')}
				{@render head('due', 'Due')}
				<th>Tags</th>
				{@render head('status', 'Status')}
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each sorted as todo (todo.id)}
				<TableRow {todo} />
			{/each}
			{#if todos.length === 0}
				<tr><td colspan="7" class="empty">No tasks yet</td></tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow: auto;
		scrollbar-width: thin;
		max-height: 65vh;
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92em;
	}

	thead th {
		position: sticky;
		top: 0;
		z-index: 1;
		text-align: left;
		font-family: var(--font-mono);
		font-size: 0.72em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		background: var(--surface-2);
		padding: 0.6em 0.9em;
		border-bottom: 1px solid var(--border);
	}

	thead button {
		all: unset;
		cursor: pointer;
	}

	thead button:hover {
		color: var(--ink);
	}

	.arrow {
		display: inline-block;
		width: 1em;
		text-align: center;
	}

	th[aria-sort] button {
		color: var(--ink);
	}

	.empty {
		text-align: center;
		color: var(--dim);
		padding: 1.5em;
	}
</style>
