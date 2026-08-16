<script lang="ts">
	import { Button, Card, Issue } from '@template/ui';
	import { removeTodo } from '../../api/todos.remote';
	import type { Todo } from '@template/core/todo';
	import StatusPill from '../StatusPill.svelte';
	import StatusPicker from '../StatusPicker.svelte';
	import TagList from '../TagList.svelte';
	import { color, late } from '../../status';
	import { peek } from '$lib/utils/peek';
	import { fmt } from '$lib/utils/fmt';

	let { todo }: { todo: Todo.Info } = $props();

	const f = fmt();
	const remove = $derived(removeTodo.for(todo.id));

	const preview = $derived(
		todo.body
			?.replace(/```[\s\S]*?```/g, ' ')
			.replace(/[#*`_>~-]/g, ' ')
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/\s+/g, ' ')
			.trim()
	);

	const span = $derived(
		[todo.startDate && f.date(todo.startDate), todo.dueDate && f.date(todo.dueDate)]
			.filter(Boolean)
			.join(' → ')
	);
</script>

<!-- fallow-ignore-next-line code-duplication -->
<Card accent={color(todo.status)} interactive>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<Issue>{issue.message}</Issue>
	{/each}

	<div class="head">
		<a class="title" href="/todos/{todo.id}" onclick={peek({ selected: todo.id })}>{todo.title}</a>
		<StatusPill status={todo.status} reason={todo.reason} />
	</div>

	{#if preview}
		<p class="preview">{preview}</p>
	{/if}

	<div class="meta">
		{#if todo.stage}<span class="stage">{todo.stage}</span>{/if}
		<TagList tags={todo.tags} />
		{#if span}<span class="span" class:late={late(todo)}>{span}</span>{/if}
	</div>

	<div class="actions">
		<StatusPicker {todo} compact />
		<span class="who">{todo.assignee?.name ?? 'Unassigned'}</span>
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

	.stage {
		border: 1px solid var(--border-bright);
		border-radius: 4px;
		font-family: var(--font-mono);
		font-size: 0.7em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		padding: 0.2em 0.5em;
	}

	.span {
		color: var(--dim);
		font-size: 0.78em;
		font-family: var(--font-mono);
		margin-left: auto;
		white-space: nowrap;
	}

	.span.late {
		color: var(--danger);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.85em;
	}

	.who {
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--dim);
		margin-left: auto;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
