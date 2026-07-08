<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { getStatuses } from '../../api/todos.remote';
	import TodoCard from '../card/TodoCard.svelte';
	import { color, label } from '../../status';

	let { todos }: { todos: Todo.Info[] } = $props();
	const statuses = $derived(await getStatuses());
</script>

<div class="board">
	{#each statuses as status (status)}
		{@const items = todos.filter((t) => t.status === status)}
		<div class="column">
			<div class="column-head">
				<span class="dot" style:background={color(status)}></span>
				<span class="title">{label(status)}</span>
				<span class="count">{items.length}</span>
			</div>
			<div class="column-body">
				{#each items as todo (todo.id)}
					<TodoCard {todo} />
				{/each}
				{#if items.length === 0}
					<p class="empty">No tasks</p>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.board {
		display: flex;
		gap: 1em;
		align-items: start;
		overflow-x: auto;
		scrollbar-width: thin;
		padding-bottom: 0.5em;
	}

	.column {
		flex: 0 0 17em;
		max-height: 65vh;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.75em;
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		min-height: 8em;
	}

	.column-head {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--muted);
		padding: 0 0.2em;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}

	.title {
		color: var(--ink);
		flex: 1;
	}

	.count {
		color: var(--dim);
	}

	.column-body {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: thin;
	}

	.empty {
		color: var(--dim);
		font-size: 0.85em;
		margin: 0.5em 0.2em;
	}
</style>
