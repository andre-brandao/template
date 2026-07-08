<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card } from '@template/ui';
	import { getTodo, removeTodo } from '../api/todos.remote';
	import StatusPill from '../components/StatusPill.svelte';
	import StatusSelect from '../components/StatusSelect.svelte';
	import StageRail from '../components/StageRail.svelte';

	let { id }: { id: string } = $props();
	const todo = $derived(await getTodo(id));
	const remove = $derived(removeTodo.for(todo.id));
</script>

<a class="back" href="/todos">&larr; Back to todos</a>

<Card>
	{#each remove.fields.allIssues() ?? [] as issue}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="head">
		<h1>{todo.title}</h1>
		<StatusPill status={todo.status} />
	</div>

	<StageRail status={todo.status} />

	{#if todo.dueDate}
		<p class="due">Due {new Date(todo.dueDate).toLocaleDateString()}</p>
	{/if}

	<div class="actions">
		<StatusSelect {todo} />
		<form {...remove.enhance(async (f) => {
			await f.submit();
			goto('/todos');
		})}>
			<input {...remove.fields.id.as('hidden', todo.id)} />
			<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
		</form>
	</div>
</Card>

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

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 1em;
	}
</style>
