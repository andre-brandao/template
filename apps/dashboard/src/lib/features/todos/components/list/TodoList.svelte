<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import Row from './Row.svelte';
	import { tree } from '../../tree';

	let { todos }: { todos: Todo.Info[] } = $props();
</script>

<ul>
	{#each tree(todos) as todo (todo.id)}
		<Row {todo} depth={todo.depth} />
	{/each}
</ul>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--border);
	}
</style>
