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
