<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card, Input } from '@template/ui';
	import type { Event } from '@template/core/event';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import StatusPill from '$lib/features/todos/components/StatusPill.svelte';
	import { getStages, getTodos } from '$lib/features/todos/api/todos.remote';
	import Skeleton from '$lib/features/todos/components/insights/Skeleton.svelte';
	import { late } from '$lib/features/todos/status';
	import { fmt } from '$lib/utils/fmt';
	import { getProject, removeProject, updateProject } from '../api/projects.remote';

	let { id }: { id: string } = $props();

	const f = fmt();
	const scope = $derived({ source: 'project', sourceID: id });

	const update = $derived(updateProject.for(id));
	const remove = $derived(removeProject.for(id));

	let editing = $state(false);

	const span = (stage: { start: string | null; end: string | null }) =>
		[stage.start && f.date(stage.start), stage.end && f.date(stage.end)].filter(Boolean).join(' → ');

	const eventLabels: Record<string, string> = {
		'project.created': 'Created',
		'project.updated': 'Updated',
		'project.removed': 'Removed'
	};
</script>

<a class="back" href="/projects">&larr; Back to projects</a>

<!--
	Each section awaits its own query in the markup — Svelte runs sibling awaits
	concurrently, so this is a `Promise.all` without the plumbing, and a slow list
	can't hold the header back.
-->
<svelte:boundary>
	{@const project = await getProject(id)}
	<Card>
		{#each update.fields.allIssues() ?? [] as issue, i (i)}
			<p class="error">{issue.message}</p>
		{/each}

		{#if editing}
			<form
				class="edit"
				{...update.enhance(async (f) => {
					await f.submit();
					await getProject(id).refresh();
					editing = false;
				})}
			>
				<input {...update.fields.id.as('hidden', id)} />
				<Input {...update.fields.name.as('text')} value={project.name} />
				<Input
					{...update.fields.description.as('text')}
					value={project.description ?? ''}
					placeholder="Description"
				/>
				<div class="row">
					<Button type="submit" pending={!!update.pending}>Save</Button>
					<Button variant="ghost" type="button" onclick={() => (editing = false)}>Cancel</Button>
				</div>
			</form>
		{:else}
			<div class="head">
				<h1>{project.name}</h1>
				<Button variant="ghost" onclick={() => (editing = true)}>Rename</Button>
			</div>
			{#if project.description}
				<p class="blurb">{project.description}</p>
			{/if}
		{/if}

		<div class="row">
			<a class="link" href="/projects/{id}/todos">Todos</a>
			<a class="link" href="/projects/{id}/insights">Insights</a>
			<form
				{...remove.enhance(async (f) => {
					await f.submit();
					goto('/projects');
				})}
			>
				<input {...remove.fields.id.as('hidden', id)} />
				<Button variant="danger" type="submit" pending={!!remove.pending}>Delete</Button>
			</form>
		</div>
	</Card>
</svelte:boundary>

<svelte:boundary>
	{#snippet pending()}<Skeleton height="128px" />{/snippet}
	{@const stages = await getStages(scope)}
	<section>
		<h2>Stages</h2>
		{#if stages.length === 0}
			<p class="empty">No stages yet — give a todo a stage label to start one.</p>
		{:else}
			<ul class="stages">
				{#each stages as stage (stage.name)}
					<li>
						<a href="/projects/{id}/todos?stage={encodeURIComponent(stage.name)}">{stage.name}</a>
						<span class="when">{span(stage) || 'undated'}</span>
						<span class="count">{stage.done}/{stage.total}</span>
						<span class="track">
							<span class="fill" style:width="{(stage.done / stage.total) * 100}%"></span>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</svelte:boundary>

<svelte:boundary>
	{#snippet pending()}<Skeleton height="128px" />{/snippet}
	{@const todos = await getTodos(scope)}
	<section>
		<h2>Recent todos</h2>
		{#if todos.length === 0}
			<p class="empty">Nothing here yet.</p>
		{:else}
			<ul class="todos">
				{#each todos.slice(0, 8) as todo (todo.id)}
					<li>
						<a href="/todos/{todo.id}">{todo.title}</a>
						<span class="when" class:late={late(todo)}>
							{todo.dueDate ? f.date(todo.dueDate) : '—'}
						</span>
						<StatusPill status={todo.status} />
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</svelte:boundary>

<Timeline source="project" sourceID={id} title="Activity">
	{#snippet label(event: Event.Info)}
		{eventLabels[event.type] ?? event.type}
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
	}

	h1 {
		margin: 0;
		font-size: 1.3em;
	}

	h2 {
		margin: 0 0 0.6em;
		font-size: 1em;
	}

	.blurb {
		color: var(--muted);
		font-size: 0.9em;
		margin: 0.5em 0 0;
	}

	.edit {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75em;
		margin-top: 1em;
	}

	.row form {
		margin-left: auto;
	}

	.link {
		font-family: var(--font-mono);
		font-size: 0.72em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		text-decoration: none;
	}

	.link:hover {
		color: var(--accent);
	}

	section {
		margin-top: 1.5em;
	}

	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		padding: 0;
		margin: 0;
	}

	li {
		display: grid;
		align-items: center;
		gap: 0.75em;
		padding: 0.6em 0;
		border-top: 1px solid var(--border);
	}

	.stages li {
		grid-template-columns: 1fr auto auto 6em;
	}

	.todos li {
		grid-template-columns: 1fr auto auto;
	}

	li:first-child {
		border-top: 0;
	}

	li a {
		color: var(--ink);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	li a:hover {
		color: var(--accent);
	}

	.when,
	.count {
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--dim);
		white-space: nowrap;
	}

	.when.late {
		color: var(--danger);
	}

	.track {
		height: 0.5em;
		border-radius: 999px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--done);
	}

	.empty {
		color: var(--dim);
		font-size: 0.9em;
		margin: 0;
	}
</style>
