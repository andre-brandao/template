<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { invalidate } from '$lib/query';
	import { Button, Field, Input, Issue, Section, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import Can from '$lib/components/Can.svelte';
	import { get, update } from '../api/projects.query';
	import DeleteDialog from '../components/DeleteDialog.svelte';

	let { id }: { id: string } = $props();

	const project = createQuery(() => get(id));

	let saved = $state(false);
	const save = update({ onSuccess: () => (saved = true) });

	// Seeded from the loaded project and edited locally; a new project reseeds them.
	let name = $derived(project.data?.name ?? '');
	let description = $derived(project.data?.description ?? '');
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

		{#if save.error}
			<Issue>{save.error.message}</Issue>
		{/if}

		<form
			oninput={() => (saved = false)}
			onsubmit={(e) => {
				e.preventDefault();
				save.mutate({ path: { id }, body: { name, description: description || null } });
			}}
		>
			<Field label="Name">
				<Input required value={name} oninput={(e) => (name = e.currentTarget.value)} />
			</Field>

			<Field label="Description">
				<Input
					placeholder="What is this for?"
					value={description}
					oninput={(e) => (description = e.currentTarget.value)}
				/>
			</Field>

			<div class="foot">
				{#if saved}<span class="saved">Saved</span>{/if}
				<Button type="submit" pending={save.isPending}>Save changes</Button>
			</div>
		</form>
	</Section>

	<Can grants={{ project: ['delete'] }} owner={project.data.createdBy}>
		<Section
			danger
			divider
			title="Delete project"
			description="Takes its stages and insights with it. Its todos are kept."
		>
			<!-- A block wrapper so the button keeps its own width in the stretched column. -->
			<div><DeleteDialog {id} name={project.data.name} /></div>
		</Section>
	</Can>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.9em;
	}

	.saved {
		font-size: 0.93em;
		font-weight: 500;
		color: var(--done);
	}
</style>
