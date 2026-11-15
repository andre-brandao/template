<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Field, Inline, Issue, Section, Skeleton, Status } from '@template/ui';
	import * as Header from '$lib/components/header';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import Can from '$lib/components/Can.svelte';
	import { ask } from '$lib/ask';
	import { get, refresh, remove, update } from '../api/projects.query';

	let { id }: { id: string } = $props();

	const project = createQuery(() => get(id));
	const save = update();
	const drop = remove({ onSuccess: () => goto('/projects') });

	async function del(name: string) {
		const ok = await ask({
			title: 'Delete project',
			name,
			warn: 'This removes {name} with its stages and insights. Its todos are kept.',
			verify: true
		});
		if (ok) drop.mutate({ path: { id } });
	}
</script>

{#snippet back()}<a href="/projects/{id}">{project.data?.name ?? 'Project'}</a>{/snippet}

<Header.Root title="Settings" eyebrow={back} />

{#if project.isPending}
	<Skeleton h="12em" />
{:else if project.isError}
	<Issue retry={() => project.refetch()}>{project.error.message}</Issue>
{:else}
	{@const name = project.data.name}
	<Section title="Details" description="Shown on the projects page and in the project switcher.">
		<AvatarUpload
			name={project.data.name}
			image={project.data.image}
			url="/avatars/project/{id}"
			onchange={refresh}
		/>

		<Field as="div" label="Name">
			<Inline
				label="Name"
				required
				flush
				value={project.data.name}
				onsave={(name) => save.mutateAsync({ path: { id }, body: { name } })}
			/>
		</Field>

		<Field as="div" label="Description">
			<Inline
				label="Description"
				placeholder="Add a description"
				multiline
				flush
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
			<div class="danger">
				<Button variant="danger" pending={drop.isPending} onclick={() => del(name)}>
					Delete project
				</Button>
				{#if drop.error}<Status state="failed" message={drop.error.message} />{/if}
			</div>
		</Section>
	</Can>
{/if}

<style>
	/* Keeps the button its own width in the stretched column. */
	.danger {
		display: flex;
		align-items: center;
		gap: 0.6em;
	}
</style>
