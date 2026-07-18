<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import TableRow from './TableRow.svelte';

	let { todos }: { todos: Todo.Info[] } = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>Title</th>
				<th>Tags</th>
				<th>State</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each todos as todo (todo.id)}
				<TableRow {todo} />
			{/each}
			{#if todos.length === 0}
				<tr><td colspan="4" class="empty">No tasks yet</td></tr>
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

	.empty {
		text-align: center;
		color: var(--dim);
		padding: 1.5em;
	}
</style>
