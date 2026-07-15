<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import TodoCard from '../card/TodoCard.svelte';

	let { todos }: { todos: Todo.Info[] } = $props();
</script>

<div class="list">
	{#each todos as todo (todo.id)}
		<TodoCard {todo} />
	{/each}
	{#if todos.length === 0}
		<p class="empty">No tasks match this filter</p>
	{/if}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		max-height: 65vh;
		overflow-y: auto;
		scrollbar-width: thin;
		padding-right: 0.25em;
	}

	.empty {
		color: var(--dim);
		font-size: 0.85em;
		margin: 0.5em 0.2em;
	}
</style>
