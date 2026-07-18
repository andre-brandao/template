<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card } from '@template/ui';
	import { Markdown, MarkdownEditor } from 'carta-md';
	import 'carta-md/default.css';
	import '@cartamd/plugin-attachment/default.css';
	import '$lib/markdown.css';
	import { createCarta } from '$lib/markdown';
	import { getTodo, getEvents, removeTodo, updateTodo } from '../api/todos.remote';
	import StatePill from '../components/StatePill.svelte';
	import StateToggle from '../components/StateToggle.svelte';
	import TagList from '../components/TagList.svelte';
	import ActivityFeed from '../components/ActivityFeed.svelte';

	let { id }: { id: string } = $props();
	// `$derived(await query())` only re-subscribes when its args change, not when the
	// query is refreshed in place — `gen` is read (and bumped after a save) purely to
	// force this derived to re-evaluate and pick up the refreshed value.
	let gen = $state(0);
	const todo = $derived((gen, await getTodo(id)));
	const events = $derived(await getEvents(todo.id));
	const remove = $derived(removeTodo.for(todo.id));
	const update = $derived(updateTodo.for(todo.id));
	const carta = createCarta();

	let editing = $state(false);
	let body = $state('');

	function edit() {
		body = todo.body ?? '';
		editing = true;
	}
</script>

<a class="back" href="/todos">&larr; Back to todos</a>

<!-- fallow-ignore-next-line code-duplication -->
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

	{#if editing}
		<form
			class="edit"
			{...update.enhance(async (f) => {
				await f.submit();
				await getTodo(todo.id).refresh();
				gen++;
				editing = false;
			})}
		>
			<input {...update.fields.id.as('hidden', todo.id)} />
			<MarkdownEditor {carta} bind:value={body} />
			<input type="hidden" {...update.fields.body.as('hidden', body)} />
			<div class="edit-actions">
				<Button type="submit" pending={!!update.pending}>Save</Button>
				<Button variant="ghost" type="button" onclick={() => (editing = false)}>Cancel</Button>
			</div>
		</form>
	{:else}
		{#if todo.body}
			<div class="body">
				<Markdown {carta} value={todo.body} />
			</div>
		{:else}
			<p class="empty-body">No description yet.</p>
		{/if}
		<Button variant="ghost" onclick={edit}>{todo.body ? 'Edit description' : 'Add description'}</Button>
	{/if}

	<div class="actions">
		<StateToggle {todo} />
		<!-- fallow-ignore-next-line code-duplication -->
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

	.empty-body {
		color: var(--dim);
		font-size: 0.9em;
		font-style: italic;
		margin: 1em 0 0;
	}

	.edit {
		margin-top: 1em;
	}

	.edit-actions {
		display: flex;
		gap: 0.5em;
		margin-top: 0.6em;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-top: 1em;
	}
</style>
