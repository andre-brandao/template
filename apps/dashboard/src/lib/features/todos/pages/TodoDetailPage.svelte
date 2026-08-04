<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card, Input } from '@template/ui';
	import { Markdown, MarkdownEditor } from 'carta-md';
	import 'carta-md/default.css';
	import '@cartamd/plugin-attachment/default.css';
	import '$lib/markdown.css';
	import { createCarta } from '$lib/markdown';
	import type { Event } from '@template/core/event';
	import { getTodo, planTodo, removeTodo, updateTodo } from '../api/todos.remote';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import StatusPill from '../components/StatusPill.svelte';
	import StatusPicker from '../components/StatusPicker.svelte';
	import AssigneePicker from '../components/AssigneePicker.svelte';
	import StagePicker from '../components/StagePicker.svelte';
	import TagList from '../components/TagList.svelte';
	import { color, late } from '../status';
	import { fmt } from '$lib/utils/fmt';

	let { id }: { id: string } = $props();

	const f = fmt();
	// `$derived(await query())` only re-subscribes when its args change, not when the
	// query is refreshed in place — `gen` is read (and bumped after a save) purely to
	// force this derived to re-evaluate and pick up the refreshed value.
	let gen = $state(0);
	const todo = $derived((void gen, await getTodo(id)));
	const remove = $derived(removeTodo.for(todo.id));
	const update = $derived(updateTodo.for(todo.id));
	const plan = $derived(planTodo.for(todo.id));
	const carta = createCarta();

	const scope = $derived({
		source: todo.source ?? undefined,
		sourceID: todo.sourceID ?? undefined
	});
	const day = (at: string | null) => at?.slice(0, 10) ?? '';

	let editing = $state(false);
	let body = $state('');

	function edit() {
		body = todo.body ?? '';
		editing = true;
	}

	async function saved() {
		await getTodo(todo.id).refresh();
		gen++;
	}

	const eventLabels: Record<string, string> = {
		'todo.created': 'Created',
		'todo.updated': 'Updated',
		'todo.status': 'Status',
		'todo.assigned': 'Assigned',
		'todo.removed': 'Removed'
	};

	function eventLabel(event: Event.Info) {
		const base = eventLabels[event.type] ?? event.type;
		if (event.type === 'todo.status')
			return `${base} → ${event.data.to}${event.data.reason ? ` (${event.data.reason})` : ''}`;
		return base;
	}
</script>

<a class="back" href="/todos">&larr; Back to todos</a>

<!-- fallow-ignore-next-line code-duplication -->
<Card accent={color(todo.status)}>
	{#each remove.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="head">
		<h1>{todo.title}</h1>
		<StatusPill status={todo.status} reason={todo.reason} />
	</div>

	<TagList tags={todo.tags} />

	<dl class="facts">
		<div><dt>Stage</dt><dd>{todo.stage ?? '—'}</dd></div>
		<div>
			<dt>Planned</dt>
			<dd class:late={late(todo)}>
				{todo.startDate ? f.date(todo.startDate) : '—'} → {todo.dueDate
					? f.date(todo.dueDate)
					: '—'}
			</dd>
		</div>
		<div>
			<dt>Actual</dt>
			<dd>
				{todo.timeStarted ? f.date(todo.timeStarted) : 'not started'}
				{#if todo.timeDone}&rarr; {f.date(todo.timeDone)}{/if}
			</dd>
		</div>
		{#if todo.source === 'project' && todo.sourceID}
			<div><dt>Project</dt><dd><a href="/projects/{todo.sourceID}">open</a></dd></div>
		{/if}
	</dl>

	<form
		class="plan"
		{...plan.enhance(async (f) => {
			await f.submit();
			await saved();
		})}
	>
		<input {...plan.fields.id.as('hidden', todo.id)} />
		<label>
			<span>Stage</span>
			<StagePicker {scope} {...plan.fields.stage.as('text')} value={todo.stage ?? ''} />
		</label>
		<label>
			<span>Assignee</span>
			<AssigneePicker {...plan.fields.assignee.as('select')} value={todo.assignee?.id ?? ''} />
		</label>
		<label>
			<span>Start</span>
			<Input {...plan.fields.startDate.as('date')} value={day(todo.startDate)} />
		</label>
		<label>
			<span>Due</span>
			<Input {...plan.fields.dueDate.as('date')} value={day(todo.dueDate)} />
		</label>
		<Button type="submit" variant="secondary" pending={!!plan.pending}>Save plan</Button>
	</form>

	{#if editing}
		<form
			class="edit"
			{...update.enhance(async (f) => {
				await f.submit();
				await saved();
				editing = false;
			})}
		>
			<input {...update.fields.id.as('hidden', todo.id)} />
			<MarkdownEditor {carta} bind:value={body} />
			<input {...update.fields.body.as('hidden', body)} />
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
		<Button variant="ghost" onclick={edit}>
			{todo.body ? 'Edit description' : 'Add description'}
		</Button>
	{/if}

	<div class="actions">
		<StatusPicker {todo} />
		<!-- fallow-ignore-next-line code-duplication -->
		<form
			{...remove.enhance(async (f) => {
				await f.submit();
				goto('/todos');
			})}
		>
			<input {...remove.fields.id.as('hidden', todo.id)} />
			<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
		</form>
	</div>
</Card>

<Timeline source="todo" sourceID={todo.id} title="Activity">
	{#snippet label(event)}
		{eventLabel(event)}
	{/snippet}
</Timeline>

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

	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 1.25em;
		margin: 1em 0 0;
	}

	dt {
		font-family: var(--font-mono);
		font-size: 0.68em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dim);
	}

	dd {
		margin: 0.2em 0 0;
		font-size: 0.88em;
		color: var(--muted);
	}

	dd.late {
		color: var(--danger);
	}

	.plan {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75em;
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--border);
	}

	.plan label {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		min-width: 9em;
	}

	.plan span {
		font-family: var(--font-mono);
		font-size: 0.68em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dim);
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
