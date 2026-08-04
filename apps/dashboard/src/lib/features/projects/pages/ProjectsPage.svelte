<script lang="ts">
	import { z } from 'zod';
	import { query } from '$lib/utils/params';
	import { Button, Card, Drawer } from '@template/ui';
	import { getProjects, removeProject } from '../api/projects.remote';
	import ProjectForm from '../components/ProjectForm.svelte';

	const params = query(z.object({ q: z.string().default('') }));
	const projects = $derived(await getProjects({ q: params.q || undefined }));

	let adding = $state(false);
</script>

<h1>Projects</h1>

<div class="toolbar">
	<input
		class="search"
		type="search"
		placeholder="Search projects…"
		value={params.q}
		oninput={(e) => params.update({ q: e.currentTarget.value })}
	/>
	<Button onclick={() => (adding = true)}>New project</Button>
</div>

<Drawer bind:open={adding}>
	<h2>New project</h2>
	<ProjectForm onsuccess={() => (adding = false)} />
</Drawer>

<div class="grid">
	{#each projects as project (project.id)}
		{@const remove = removeProject.for(project.id)}
		<Card interactive>
			<a class="name" href="/projects/{project.id}">{project.name}</a>
			{#if project.description}
				<p class="blurb">{project.description}</p>
			{/if}
			<div class="actions">
				<a class="link" href="/projects/{project.id}/todos">Todos</a>
				<a class="link" href="/projects/{project.id}/insights">Insights</a>
				<form {...remove}>
					<input {...remove.fields.id.as('hidden', project.id)} />
					<Button variant="ghost" type="submit" pending={!!remove.pending}>Delete</Button>
				</form>
			</div>
		</Card>
	{/each}
	{#if projects.length === 0}
		<p class="empty">No projects yet.</p>
	{/if}
</div>

<style>
	h1 {
		margin: 0 0 0.75em;
		font-size: 1.4em;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
		margin-bottom: 1.25em;
	}

	.search {
		font: inherit;
		padding: 0.45em 0.7em;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: var(--ink);
		min-width: 14em;
		margin-right: auto;
	}

	.search:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
		gap: 0.75em;
	}

	.name {
		color: var(--ink);
		font-weight: 500;
		text-decoration: none;
	}

	.name:hover {
		color: var(--accent);
	}

	.blurb {
		color: var(--muted);
		font-size: 0.85em;
		margin: 0.4em 0 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.75em;
		margin-top: 0.85em;
	}

	.link {
		font-family: var(--font-mono);
		font-size: 0.72em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		text-decoration: none;
	}

	.link:hover {
		color: var(--accent);
	}

	.actions form {
		margin-left: auto;
	}

	.empty {
		color: var(--dim);
		font-size: 0.9em;
	}
</style>
