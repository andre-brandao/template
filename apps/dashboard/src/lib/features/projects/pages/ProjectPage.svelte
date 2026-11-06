<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Event } from '@template/core/event';
	import { Section } from '@template/ui';
	import * as Header from '$lib/components/header';
	import Timeline from '$lib/features/events/components/Timeline.svelte';
	import { getProject, linkProject, unlinkProject } from '../api/projects.remote';
	import Links from '$lib/components/Links.svelte';
	import Annotations from '$lib/components/Annotations.svelte';
	import { fmt } from '$lib/utils/fmt';

	// The stages/todos sections and their header facts come in as snippets so this slice
	// never imports the todos feature — the route composes the two.
	let {
		id,
		stages,
		todos,
		facts
	}: { id: string; stages: Snippet; todos: Snippet; facts?: Snippet } = $props();

	const f = fmt();

	const eventLabels: Record<string, string> = {
		'project.created': 'Created',
		'project.updated': 'Updated',
		'project.removed': 'Removed'
	};
</script>

{#snippet back()}<a href="/projects">Projects</a>{/snippet}

<svelte:boundary>
	{#snippet pending()}<Header.Root title="Project" eyebrow={back} />{/snippet}
	{@const project = await getProject(id)}
	<Header.Root title={project.name} eyebrow={back} lead={project.description ?? undefined}>
		{@render facts?.()}
		<Header.Item label="Created">{f.date(project.timeCreated)}</Header.Item>
	</Header.Root>
</svelte:boundary>

<!--
	Stages carry four columns of their own, so they take the long side of the split
	and the two narrower lists share the short one.
-->
<div class="split">
	<div class="col">
		<Section wide title="Stages">
			{@render stages()}
		</Section>
	</div>

	<div class="col">
		<svelte:boundary>
			{@const project = await getProject(id)}
			<Section wide title="Links">
				<Links
					id={project.id}
					links={project.metadata.links}
					add={linkProject.for(project.id)}
					drop={(url) => unlinkProject.for(`${project.id}:${url}`)}
					onsaved={() => getProject(project.id).refresh()}
				/>
			</Section>

			{#if Object.keys(project.metadata.annotations).length}
				<Section wide title="Annotations">
					<Annotations annotations={project.metadata.annotations} />
				</Section>
			{/if}
		</svelte:boundary>

		<Section wide title="Recent todos">
			{@render todos()}
		</Section>

		<!-- Heading lives here rather than Timeline's `title`, so it matches the sections above. -->
		<Section wide title="Logs">
			<Timeline source="project" sourceID={id}>
				{#snippet label(event: Event.Info)}
					{eventLabels[event.type] ?? event.type}
				{/snippet}
			</Timeline>
		</Section>
	</div>
</div>

<style>
	/* Golden section: the long column is φ (1.618) times the short one. */
	.split {
		display: grid;
		grid-template-columns: 1.618fr 1fr;
		align-items: start;
		gap: 2.5em;
	}

	.col {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2.25em;
	}

	@media (max-width: 900px) {
		.split {
			grid-template-columns: 1fr;
			gap: 2.25em;
		}
	}
</style>
