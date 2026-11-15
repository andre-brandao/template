<script lang="ts">
	import { Button, Card, Field, Input, Issue, Section } from '@template/ui';
	import * as Header from '$lib/components/header';
	import Source from '$lib/features/events/components/Source.svelte';
	import { fmt } from '$lib/utils/fmt';
	import type { Event } from '@template/core/event';
	import {
		getTodo,
		linkTodo,
		planTodo,
		removeTodo,
		unlinkTodo,
		updateTodo
	} from '../api/todos.remote';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import StatusPill from './StatusPill.svelte';
	import StatusPicker from './StatusPicker.svelte';
	import AssigneePicker from './AssigneePicker.svelte';
	import StagePicker from './StagePicker.svelte';
	import TagList from './TagList.svelte';
	import Facts from './editor/Facts.svelte';
	import Description from './editor/Description.svelte';
	import SubIssues from './editor/SubIssues.svelte';
	import Links from '$lib/components/Links.svelte';
	import Annotations from '$lib/components/Annotations.svelte';
	import { color, late } from '../status';

	let {
		id,
		page = false,
		onremove
	}: {
		id: string;
		/** On its own route: the record header with facts, instead of the drawer's compact head. */
		page?: boolean;
		onremove: () => void;
	} = $props();
	const f = fmt();
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

{#snippet parent()}
	{#if todo.source === 'project' && todo.sourceID}
		<a href="/projects/{todo.sourceID}">
			<Source source={todo.source} sourceID={todo.sourceID} fallback="Project" />
		</a>
		<span aria-hidden="true">/</span>
		<a href="/projects/{todo.sourceID}/todos">Todos</a>
	{:else}
		<a href="/todos">Todos</a>
	{/if}
{/snippet}

{#if page}
	<Header.Root title={todo.title} eyebrow={parent}>
		<Header.Item label="Status"><StatusPill status={todo.status} reason={todo.reason} /></Header.Item>
		<Header.Item label="Assignee">{todo.assignee?.name ?? 'Unassigned'}</Header.Item>
		<Header.Item label="Stage">{todo.stage ?? '—'}</Header.Item>
		<Header.Item label="Due">
			<span class={{ late: late(todo) }}>{todo.dueDate ? f.date(todo.dueDate) : '—'}</span>
		</Header.Item>
	</Header.Root>
{/if}

<div class="editor">
	<div class="grid">
		<div class="main">
			{#if !page}
				<!-- Flat, like a page header: the title is the hierarchy, a hairline closes it. -->
				<header class="head">
					<h1>{todo.title}</h1>
					<div class="pills">
						<StatusPill status={todo.status} reason={todo.reason} />
					</div>
				</header>
			{/if}

			<!-- fallow-ignore-next-line code-duplication -->
			<Card accent={color(todo.status)}>
				<TagList tags={todo.tags} />

				<Description {todo} {update} onsaved={saved} />
			</Card>

			<SubIssues {todo} />
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
					<Field label="Stage">
						<StagePicker {scope} {...plan.fields.stage.as('text', todo.stage ?? '')} />
					</Field>
					<Field label="Assignee">
						<AssigneePicker
							selected={todo.assignee}
							{...plan.fields.assignee.as('select', todo.assignee?.id ?? '')}
						/>
					</Field>
					<div class="pair">
						<Field label="Start">
							<Input {...plan.fields.startDate.as('date', day(todo.startDate))} />
						</Field>
						<Field label="Due">
							<Input {...plan.fields.dueDate.as('date', day(todo.dueDate))} />
						</Field>
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

			<Card>
				<Section wide title="Links">
					<Links
						id={todo.id}
						links={todo.metadata.links}
						add={linkTodo.for(`${todo.id}:editor`)}
						drop={(url) => unlinkTodo.for(`${todo.id}:${url}`)}
						onsaved={saved}
					/>
				</Section>
				{#if Object.keys(todo.metadata.annotations).length}
					<Section wide divider title="Annotations">
						<Annotations annotations={todo.metadata.annotations} />
					</Section>
				{/if}
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
		display: flex;
		flex-direction: column;
		gap: 1.25em;
	}

	.side {
		grid-area: side;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25em;
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

	.late {
		color: var(--danger);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.9em;
		padding-bottom: 1em;
		border-bottom: 1px solid var(--border);
	}

	.pills {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex: none;
	}

	h1 {
		margin: 0;
		font-size: 1.4em;
		line-height: 1.25;
		overflow-wrap: anywhere;
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

	.plan .pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8em, 1fr));
		gap: 0.75em;
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
