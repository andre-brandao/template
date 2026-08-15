<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Empty } from '@template/ui';
	import TodoCard from '../card/TodoCard.svelte';

	let { todos }: { todos: Todo.Info[] } = $props();
</script>

<div class="list">
	{#each todos as todo (todo.id)}
		<TodoCard {todo} />
	{/each}
	{#if todos.length === 0}
		<Empty>No tasks match this filter</Empty>
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
</style>
