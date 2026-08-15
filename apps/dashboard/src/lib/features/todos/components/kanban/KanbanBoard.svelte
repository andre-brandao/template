<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Empty } from '@template/ui';
	import TodoCard from '../card/TodoCard.svelte';
	import { group, type By } from '../../group';

	let { todos, by = 'status' }: { todos: Todo.Info[]; by?: By } = $props();

	const columns = $derived(group(todos, by));
</script>

<div class="board">
	{#each columns as column (column.key)}
		<div class="column">
			<div class="column-head">
				<span class="dot" style:background={column.color ?? 'var(--border-bright)'}></span>
				<span class="title">{column.label}</span>
				<span class="count">{column.items.length}</span>
			</div>
			<div class="column-body">
				{#each column.items as todo (todo.id)}
					<TodoCard {todo} />
				{/each}
				{#if column.items.length === 0}
					<Empty>No tasks</Empty>
				{/if}
			</div>
		</div>
	{/each}
	{#if columns.length === 0}
		<Empty>No tasks match this filter</Empty>
	{/if}
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
		flex-shrink: 0;
	}

	.title {
		color: var(--ink);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
</style>
