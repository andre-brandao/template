<script lang="ts">
	import { Button, Card, Input, Issue } from '@template/ui';
	import type { Event } from '@template/core/event';
	import { getTodo, planTodo, removeTodo, updateTodo } from '../api/todos.remote';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import StatusPill from './StatusPill.svelte';
	import StatusPicker from './StatusPicker.svelte';
	import AssigneePicker from './AssigneePicker.svelte';
	import StagePicker from './StagePicker.svelte';
	import TagList from './TagList.svelte';
	import Facts from './editor/Facts.svelte';
	import Description from './editor/Description.svelte';
	import { color } from '../status';

	let { id, onremove }: { id: string; onremove: () => void } = $props();
	// `$derived(await query())` only re-subscribes when its args change, not when the
	// query is refreshed in place — `gen` is read (and bumped after a save) purely to
	// force this derived to re-evaluate and pick up the refreshed value.
	let gen = $state(0);
	const todo = $derived((void gen, await getTodo(id)));
	// A form instance can only attach to one <form> — the row/card behind the drawer
	// already holds `removeTodo.for(id)`, so the editor namespaces its own instances.
	const remove = $derived(removeTodo.for(`${todo.id}:editor`));
	const update = $derived(updateTodo.for(`${todo.id}:editor`));
	const plan = $derived(planTodo.for(`${todo.id}:editor`));

	const scope = $derived({
		source: todo.source ?? undefined,
		sourceID: todo.sourceID ?? undefined
	});
	const day = (at: string | null) => at?.slice(0, 10) ?? '';

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

<div class="editor">
	<div class="grid">
		<div class="main">
			<!-- fallow-ignore-next-line code-duplication -->
			<Card accent={color(todo.status)}>
				<div class="head">
					<h1>{todo.title}</h1>
					<StatusPill status={todo.status} reason={todo.reason} />
				</div>

				<TagList tags={todo.tags} />

				<Description {todo} {update} onsaved={saved} />
			</Card>
		</div>

		<aside class="side">
			<Card>
				<Facts {todo} />

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
						<StagePicker {scope} {...plan.fields.stage.as('text', todo.stage ?? '')} />
					</label>
					<label>
						<span>Assignee</span>
						<AssigneePicker
							selected={todo.assignee}
							{...plan.fields.assignee.as('select', todo.assignee?.id ?? '')}
						/>
					</label>
					<div class="pair">
						<label>
							<span>Start</span>
							<Input {...plan.fields.startDate.as('date', day(todo.startDate))} />
						</label>
						<label>
							<span>Due</span>
							<Input {...plan.fields.dueDate.as('date', day(todo.dueDate))} />
						</label>
					</div>
					<Button type="submit" variant="secondary" pending={!!plan.pending}>Save plan</Button>
				</form>

				{#each remove.fields.allIssues() ?? [] as issue, i (i)}
					<Issue>{issue.message}</Issue>
				{/each}

				<div class="actions">
					<StatusPicker {todo} />
					<!-- fallow-ignore-next-line code-duplication -->
					<form
						{...remove.enhance(async (f) => {
							await f.submit();
							onremove();
						})}
					>
						<input {...remove.fields.id.as('hidden', todo.id)} />
						<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
					</form>
				</div>
			</Card>
		</aside>

		<div class="logs">
			<Timeline source="todo" sourceID={todo.id} title="Logs">
				{#snippet label(event)}
					{eventLabel(event)}
				{/snippet}
			</Timeline>
		</div>
	</div>
</div>

<style>
	/* The editor sizes its columns off its own box, not the viewport, so the same
	   component reads two-column on the detail page and single-column in the drawer. */
	.editor {
		container-type: inline-size;
	}

	.grid {
		display: grid;
		grid-template-areas: 'main' 'side' 'logs';
		gap: 1.25em;
	}

	.main {
		grid-area: main;
		min-width: 0;
	}

	.side {
		grid-area: side;
		min-width: 0;
	}

	.logs {
		grid-area: logs;
		min-width: 0;
	}

	/* Golden ratio: prose column to meta rail at φ : 1. */
	@container (min-width: 46rem) {
		.grid {
			grid-template-columns: 1.618fr 1fr;
			grid-template-areas: 'main side' 'logs side';
			align-items: start;
		}
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

	.plan {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.75em;
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--border);
	}

	.plan label {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.plan .pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8em, 1fr));
		gap: 0.75em;
	}

	.plan span {
		font-family: var(--font-mono);
		font-size: 0.68em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dim);
	}

	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--border);
	}
</style>
