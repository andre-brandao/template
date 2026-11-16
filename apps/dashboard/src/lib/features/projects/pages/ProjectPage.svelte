<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Event } from '@template/core/event';
	import { Inline } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import Widgets, { type Widget } from '#lib/components/Widgets.svelte';
	import Timeline from '#lib/features/events/components/Timeline.svelte';
	import { get, link, unlink, update } from '../api/projects.query';
	import Links from '#lib/components/Links.svelte';
	import Annotations from '#lib/components/Annotations.svelte';

	// The route composes the todo widgets and header facts, so this slice never imports the
	// todos feature; the page appends its own Links and History.
	let {
		id,
		widgets,
		facts
	}: {
		id: string;
		widgets: { main: Widget; side?: Widget[] };
		facts?: Snippet;
	} = $props();

	const project = createQuery(() => get(id));
	const attach = link();
	const detach = unlink();
	const save = update();

	const labels: Record<string, string> = {
		'project.created': 'Created',
		'project.updated': 'Updated',
		'project.removed': 'Removed'
	};

	const notes = $derived(Object.keys(project.data?.metadata.annotations ?? {}).length > 0);
</script>

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

{#snippet links()}
	<!-- The layout loads the row before this mounts, or 404s. -->
	{#if project.data}
		<Links
			links={project.data.metadata.links}
			add={(body) => attach.mutateAsync({ path: { id }, body })}
			drop={(url) => detach.mutateAsync({ path: { id }, query: { url } })}
		/>
	{/if}
{/snippet}

{#snippet annotations()}
	{#if project.data}<Annotations annotations={project.data.metadata.annotations} />{/if}
{/snippet}

{#snippet history()}
	<Timeline source="project" sourceID={id}>
		{#snippet label(event: Event.Info)}
			{labels[event.type] ?? event.type}
		{/snippet}
	</Timeline>
{/snippet}

<!-- No eyebrow: the crumbs and the rail's back link already name the parent. -->
<Header.Root {title} {lead}>
	{@render facts?.()}
</Header.Root>

<Widgets
	main={widgets.main}
	side={widgets.side}
	rest={[
		[
			{ title: 'Links', body: links },
			...(notes ? [{ title: 'Annotations', body: annotations }] : [])
		],
		[{ title: 'History', body: history, fill: true }]
	]}
/>
