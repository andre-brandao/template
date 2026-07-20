<script lang="ts">
	import { Button, Card } from '@template/ui';
	import { removeTodo } from '../../api/todos.remote';
	import type { Todo } from '@template/core/todo';
	import StatePill from '../StatePill.svelte';
	import StateToggle from '../StateToggle.svelte';
	import TagList from '../TagList.svelte';
	import { color } from '../../state';

	let { todo }: { todo: Todo.Info } = $props();
	const remove = $derived(removeTodo.for(todo.id));

	const preview = $derived(
		todo.body
			?.replace(/```[\s\S]*?```/g, ' ')
			.replace(/[#*`_>~-]/g, ' ')
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/\s+/g, ' ')
			.trim(),
	);
</script>

<!-- fallow-ignore-next-line code-duplication -->
<Card accent={color(todo.state)} interactive>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="head">
		<a class="title" href="/todos/{todo.id}">{todo.title}</a>
		<StatePill state={todo.state} />
	</div>

	{#if preview}
		<p class="preview">{preview}</p>
	{/if}

	<div class="meta">
		<TagList tags={todo.tags} />
		{#if todo.dueDate}
			<span class="due">Due {new Date(todo.dueDate).toLocaleDateString()}</span>
		{/if}
	</div>

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

	.preview {
		color: var(--muted);
		font-size: 0.85em;
		line-height: 1.45;
		margin: 0 0 0.6em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.due {
		color: var(--dim);
		font-size: 0.78em;
		font-family: var(--font-mono);
		margin-left: auto;
		white-space: nowrap;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.85em;
	}
</style>
