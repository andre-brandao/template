<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { invalidate } from '$lib/query';
	import { Button, Field, Inline, Issue, Section, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import Can from '$lib/components/Can.svelte';
	import { get, update } from '../api/projects.query';
	import Delete from '../components/Delete.svelte';

	let { id }: { id: string } = $props();

	const project = createQuery(() => get(id));
	const save = update();
</script>

{#snippet back()}<a href="/projects/{id}">{project.data?.name ?? 'Project'}</a>{/snippet}

<Header.Root title="Settings" eyebrow={back} />

{#if project.isPending}
	<Skeleton h="12em" />
{:else if project.isError}
	<Issue>{project.error.message}</Issue>
{:else}
	<Section title="Details" description="Shown on the projects page and in the project switcher.">
		<AvatarUpload
			name={project.data.name}
			image={project.data.image}
			url="/avatars/project/{id}"
			onchange={() => invalidate([{ tags: ['Project'] }])}
		/>

		<!-- Inline keeps the typed value with a dot while it saves, and reverts on failure. -->
		<Field as="div" label="Name">
			<Inline
				label="Name"
				value={project.data.name}
				onsave={(name) => {
					if (!name) throw new Error('A project needs a name');
					return save.mutateAsync({ path: { id }, body: { name } });
				}}
			/>
		</Field>

		<Field as="div" label="Description">
			<Inline
				label="Description"
				placeholder="What is this for?"
				multiline
				value={project.data.description ?? ''}
				onsave={(text) => save.mutateAsync({ path: { id }, body: { description: text || null } })}
			/>
		</Field>
	</Section>

	<Can grants={{ project: ['delete'] }} owner={project.data.createdBy}>
		<Section
			danger
			divider
			title="Delete project"
			description="Takes its stages and insights with it. Its todos are kept."
		>
			<Delete {id} name={project.data.name} ondone={() => goto('/projects')}>
				{#snippet children(ask, pending)}
					<!-- A block wrapper so the button keeps its own width in the stretched column. -->
					<div><Button variant="danger" {pending} onclick={ask}>Delete project</Button></div>
				{/snippet}
			</Delete>
		</Section>
	</Can>
{/if}
