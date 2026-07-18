<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card } from '@template/ui';
	import { Markdown } from 'carta-md';
	import 'carta-md/default.css';
	import '@cartamd/plugin-attachment/default.css';
	import { createCarta } from '$lib/markdown';
	import { getTodo, getEvents, removeTodo } from '../api/todos.remote';
	import StatePill from '../components/StatePill.svelte';
	import StateToggle from '../components/StateToggle.svelte';
	import TagList from '../components/TagList.svelte';
	import ActivityFeed from '../components/ActivityFeed.svelte';

	let { id }: { id: string } = $props();
	const todo = $derived(await getTodo(id));
	const events = $derived(await getEvents(todo.id));
	const remove = $derived(removeTodo.for(todo.id));
	const carta = createCarta();
</script>

<a class="back" href="/todos">&larr; Back to todos</a>

<Card>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="head">
		<h1>{todo.title}</h1>
		<StatePill state={todo.state} />
	</div>

	<TagList tags={todo.tags} />

	{#if todo.dueDate}
		<p class="due">Due {new Date(todo.dueDate).toLocaleDateString()}</p>
	{/if}

	{#if todo.body}
		<div class="body">
			<Markdown {carta} value={todo.body} />
		</div>
	{/if}

	<div class="actions">
		<StateToggle {todo} />
		<form {...remove.enhance(async (f) => {
			await f.submit();
			goto('/todos');
		})}>
			<input {...remove.fields.id.as('hidden', todo.id)} />
			<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
		</form>
	</div>
</Card>

<ActivityFeed {events} />

<style>
	.back {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		text-decoration: none;
		margin-bottom: 1em;
	}

	.back:hover {
		color: var(--ink);
	}

	.head {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.75em;
		margin-bottom: 0.6em;
	}

	h1 {
		margin: 0;
		font-size: 1.3em;
		word-break: break-word;
	}

	.due {
		color: var(--muted);
		font-size: 0.9em;
		margin: 0.75em 0 0;
	}

	.body {
		margin-top: 1em;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 1em;
	}
</style>
