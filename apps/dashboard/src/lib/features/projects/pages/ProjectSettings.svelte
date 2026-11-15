<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue, Section } from '@template/ui';
	import * as Header from '$lib/components/header';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import Can from '$lib/components/Can.svelte';
	import { getProject, updateProject } from '../api/projects.remote';
	import DeleteDialog from '../components/DeleteDialog.svelte';

	let { id }: { id: string } = $props();

	const project = $derived(await getProject(id));
	const update = $derived(updateProject.for(id));

	let saved = $state(false);
</script>

{#snippet back()}<a href="/projects/{id}">{project.name}</a>{/snippet}

<Header.Root title="Settings" eyebrow={back} />

<Section
	title="Details"
	description="Shown on the projects page and in the project switcher."
>
	<AvatarUpload
		name={project.name}
		image={project.image}
		url="/avatars/project/{id}"
		onchange={() => getProject(id).refresh()}
	/>

	<FormBoundary>
		{#each update.fields.allIssues() ?? [] as issue, i (i)}
			<Issue>{issue.message}</Issue>
		{/each}

		<form
			oninput={() => (saved = false)}
			{...update.enhance(async (f) => {
				await f.submit();
				await getProject(id).refresh();
				saved = true;
			})}
		>
			<input {...update.fields.id.as('hidden', id)} />

			<Field label="Name">
				<Input {...update.fields.name.as('text', project.name)} />
			</Field>

			<Field label="Description">
				<Input
					{...update.fields.description.as('text', project.description ?? '')}
					placeholder="What is this for?"
				/>
			</Field>

			<div class="foot">
				{#if saved}<span class="saved">Saved</span>{/if}
				<Button type="submit" pending={!!update.pending}>Save changes</Button>
			</div>
		</form>
	</FormBoundary>
</Section>

<Can grants={{ project: ['delete'] }} owner={project.createdBy}>
	<Section
		danger
		divider
		title="Delete project"
		description="Takes its stages and insights with it. Its todos are kept."
	>
		<!-- A block wrapper so the button keeps its own width in the stretched column. -->
		<div><DeleteDialog {id} name={project.name} /></div>
	</Section>
</Can>

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
