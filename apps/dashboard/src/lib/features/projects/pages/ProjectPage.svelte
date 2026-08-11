<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Event } from '@template/core/event';
	import Header from '$lib/components/Header.svelte';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import { getProject } from '../api/projects.remote';

	// The stages/todos sections come in as snippets so this slice never imports
	// the todos feature — the route composes the two.
	let { id, stages, todos }: { id: string; stages: Snippet; todos: Snippet } = $props();

	const eventLabels: Record<string, string> = {
		'project.created': 'Created',
		'project.updated': 'Updated',
		'project.removed': 'Removed'
	};
</script>

<svelte:boundary>
	{@const project = await getProject(id)}
	<Header title={project.name}>{project.description}</Header>
</svelte:boundary>

<!--
	Stages carry four columns of their own, so they take the long side of the split
	and the two narrower lists share the short one.
-->
<div class="split">
	<div class="col">
		<section>
			<h2>Stages</h2>
			{@render stages()}
		</section>
	</div>

	<div class="col">
		<section>
			<h2>Recent todos</h2>
			{@render todos()}
		</section>

		<!-- Heading lives here rather than Timeline's `title`, so it shares the page's
		     scoped h2 style with the two lists above it. -->
		<section class="logs">
			<h2>Logs</h2>
			<Timeline source="project" sourceID={id}>
				{#snippet label(event: Event.Info)}
					{eventLabels[event.type] ?? event.type}
				{/snippet}
			</Timeline>
		</section>
	</div>
</div>

<style>
	h2 {
		margin: 0 0 0.75em;
		font-size: 0.78em;
		font-family: var(--font-mono);
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
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

	.logs {
		display: block;
		margin-top: 2.25em;
	}

	@media (max-width: 900px) {
		.split {
			grid-template-columns: 1fr;
			gap: 2.25em;
		}
	}
</style>
