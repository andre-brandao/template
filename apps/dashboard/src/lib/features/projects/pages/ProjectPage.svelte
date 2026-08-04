<script lang="ts">
	import type { Event } from '@template/core/event';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import StatusPill from '$lib/features/todos/components/StatusPill.svelte';
	import { getStages, getTodos } from '$lib/features/todos/api/todos.remote';
	import Skeleton from '$lib/features/todos/components/insights/Skeleton.svelte';
	import { late } from '$lib/features/todos/status';
	import { fmt } from '$lib/utils/fmt';
	import { getProject } from '../api/projects.remote';

	let { id }: { id: string } = $props();

	const f = fmt();
	const scope = $derived({ source: 'project', sourceID: id });

	const span = (stage: { start: string | null; end: string | null }) =>
		[stage.start && f.date(stage.start), stage.end && f.date(stage.end)].filter(Boolean).join(' → ');

	const eventLabels: Record<string, string> = {
		'project.created': 'Created',
		'project.updated': 'Updated',
		'project.removed': 'Removed'
	};
</script>

<!--
	Each section awaits its own query in the markup — Svelte runs sibling awaits
	concurrently, so this is a `Promise.all` without the plumbing, and a slow list
	can't hold the header back.
-->
<svelte:boundary>
	{@const project = await getProject(id)}
	<header>
		<h1>{project.name}</h1>
		{#if project.description}
			<p class="blurb">{project.description}</p>
		{/if}
	</header>
</svelte:boundary>

<!--
	Stages carry four columns of their own, so they take the long side of the split
	and the two narrower lists share the short one.
-->
<div class="split">
	<div class="col">
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
	</div>

	<div class="col">
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
								<span class="meta">
									<span class="when" class:late={late(todo)}>
										{todo.dueDate ? f.date(todo.dueDate) : '—'}
									</span>
									<StatusPill status={todo.status} />
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</svelte:boundary>

		<!-- Heading lives here rather than Timeline's `title`, so it shares the page's
		     scoped h2 style with the two lists above it. -->
		<section class="activity">
			<h2>Activity</h2>
			<Timeline source="project" sourceID={id}>
				{#snippet label(event: Event.Info)}
					{eventLabels[event.type] ?? event.type}
				{/snippet}
			</Timeline>
		</section>
	</div>
</div>

<style>
	header {
		margin-bottom: 2em;
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
	}

	h2 {
		margin: 0 0 0.75em;
		font-size: 0.78em;
		font-family: var(--font-mono);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.blurb {
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.95em;
		line-height: 1.55;
		margin: 0.5em 0 0;
	}

	/* Golden section: the long column is φ (1.618) times the short one. */
	.split {
		display: grid;
		grid-template-columns: 1.618fr 1fr;
		align-items: start;
		gap: 2.5em;
	}

	.col {
		min-width: 0;
	}

	.activity {
		display: block;
		margin-top: 2.25em;
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
		gap: 0.75em;
		padding: 0.6em 0;
		border-top: 1px solid var(--border);
	}

	.stages li {
		display: grid;
		align-items: center;
		grid-template-columns: 1fr auto auto 5em;
	}

	/* Two lines, because this list sits in the short column. */
	.todos li {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
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

	.meta {
		display: flex;
		align-items: center;
		gap: 0.6em;
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

	@media (max-width: 900px) {
		.split {
			grid-template-columns: 1fr;
			gap: 2.25em;
		}
	}
</style>
