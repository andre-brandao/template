<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import { getProject, updateProject } from '../api/projects.remote';
	import DeleteDialog from '../components/DeleteDialog.svelte';

	let { id }: { id: string } = $props();

	const project = $derived(await getProject(id));
	const update = $derived(updateProject.for(id));

	let saved = $state(false);
</script>

<header>
	<h1>Settings</h1>
</header>

<!--
	Label rail on the short side of the golden section, controls on the long one, so
	each row fills the column instead of leaving the form stranded against one edge.
-->
<section class="row">
	<div class="label">
		<h2>Details</h2>
		<p>The name and blurb shown on the projects page and in the project switcher.</p>
	</div>

	<div class="controls">
		<FormBoundary>
			{#each update.fields.allIssues() ?? [] as issue, i (i)}
				<p class="error">{issue.message}</p>
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

				<label class="field">
					<span>Name</span>
					<Input {...update.fields.name.as('text', project.name)} />
				</label>

				<label class="field">
					<span>Description</span>
					<Input
						{...update.fields.description.as('text', project.description ?? '')}
						placeholder="What is this for?"
					/>
				</label>

				<div class="foot">
					{#if saved}<span class="saved">Saved</span>{/if}
					<Button type="submit" pending={!!update.pending}>Save changes</Button>
				</div>
			</form>
		</FormBoundary>
	</div>
</section>

<section class="row danger">
	<div class="label">
		<h2>Delete project</h2>
		<p>Deleting a project takes its stages and insights with it. Its todos are kept.</p>
	</div>

	<div class="controls">
		<DeleteDialog {id} name={project.name} />
	</div>
</section>

<style>
	header {
		margin-bottom: 2em;
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 0.95em;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1.618fr;
		align-items: start;
		gap: 2.5em;
	}

	.row + .row {
		margin-top: 2.5em;
		padding-top: 2.5em;
		border-top: 1px solid var(--border);
	}

	.label p {
		margin: 0;
		color: var(--muted);
		font-size: 0.88em;
		line-height: 1.55;
	}

	.danger h2 {
		color: var(--danger);
	}

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
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--done);
	}

	@media (max-width: 900px) {
		.row {
			grid-template-columns: 1fr;
			gap: 1.25em;
		}
	}
</style>
