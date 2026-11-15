<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Event } from '@template/core/event';
	import { Inline, Section } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import Timeline from '#lib/features/events/components/Timeline.svelte';
	import { get, link, unlink, update } from '../api/projects.query';
	import Links from '#lib/components/Links.svelte';
	import Annotations from '#lib/components/Annotations.svelte';
	import { fmt } from '#lib/utils/fmt.ts';

	// The stages/todos sections and their header facts come in as snippets so this slice
	// never imports the todos feature — the route composes the two.
	let {
		id,
		stages,
		todos,
		facts
	}: { id: string; stages: Snippet; todos: Snippet; facts?: Snippet } = $props();

	const f = fmt();

	const project = createQuery(() => get(id));
	const attach = link();
	const detach = unlink();
	const save = update();

	const eventLabels: Record<string, string> = {
		'project.created': 'Created',
		'project.updated': 'Updated',
		'project.removed': 'Removed'
	};
</script>

{#snippet back()}<a href="/projects">Projects</a>{/snippet}

{#snippet title()}
	{#if project.data}
		<Inline
			label="Project name"
			required
			flush
			value={project.data.name}
			onsave={(name) => save.mutateAsync({ path: { id }, body: { name } })}
		/>
	{/if}
{/snippet}

{#snippet lead()}
	{#if project.data}
		<Inline
			label="Description"
			placeholder="Add a description"
			flush
			value={project.data.description ?? ''}
			onsave={(text) => save.mutateAsync({ path: { id }, body: { description: text || null } })}
		/>
	{/if}
{/snippet}

<Header.Root {title} eyebrow={back} {lead}>
	{@render facts?.()}
	{#if project.data}
		<Header.Item label="Created">{f.date(project.data.timeCreated)}</Header.Item>
	{/if}
</Header.Root>

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
		<!-- The layout loads the row before this mounts, or 404s. -->
		{#if project.data}
			<Section wide title="Links">
				<Links
					links={project.data.metadata.links}
					add={(body) => attach.mutateAsync({ path: { id }, body })}
					drop={(url) => detach.mutateAsync({ path: { id }, query: { url } })}
				/>
			</Section>

			{#if Object.keys(project.data.metadata.annotations).length}
				<Section wide title="Annotations">
					<Annotations annotations={project.data.metadata.annotations} />
				</Section>
			{/if}
		{/if}

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
