<script lang="ts">
	import { Button, Card } from '@template/ui';
	import { removeTodo } from '../../api/todos.remote';
	import type { Todo } from '@template/core/todo';
	import StatePill from '../StatePill.svelte';
	import StateToggle from '../StateToggle.svelte';
	import TagList from '../TagList.svelte';

	let { todo }: { todo: Todo.Info } = $props();
	const remove = $derived(removeTodo.for(todo.id));
</script>

<!-- fallow-ignore-next-line code-duplication -->
<Card>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="head">
		<a class="title" href="/todos/{todo.id}">{todo.title}</a>
		<StatePill state={todo.state} />
	</div>

	<TagList tags={todo.tags} />

	<div class="actions">
		<StateToggle {todo} />
		<!-- fallow-ignore-next-line code-duplication -->
		<form {...remove}>
			<input {...remove.fields.id.as('hidden', todo.id)} />
			<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
		</form>
	</div>
</Card>

<style>
	.head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.75em;
		margin-bottom: 0.6em;
	}

	.title {
		margin: 0;
		font-weight: 500;
		word-break: break-word;
		color: var(--ink);
		text-decoration: none;
	}

	.title:hover {
		color: var(--accent);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.85em;
	}
</style>
