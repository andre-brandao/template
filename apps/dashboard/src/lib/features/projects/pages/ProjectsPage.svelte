<script lang="ts">
	import { z } from 'zod';
	import { query } from '$lib/utils/params';
	import { Button, Drawer, Empty } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import { getProjects } from '../api/projects.remote';
	import Folder from '../components/Folder.svelte';
	import ProjectForm from '../components/ProjectForm.svelte';

	const params = query(z.object({ q: z.string().default('') }));
	const projects = $derived(await getProjects({ q: params.q || undefined }));

	let adding = $state(false);
</script>

<Header title="Projects">
	{#snippet actions()}
		<Button onclick={() => (adding = true)}>New project</Button>
	{/snippet}
	Each project files a set of todos and keeps its own stages and insights. Open one to work inside
	it.
</Header>

<input
	class="search"
	type="search"
	name="search"
	autocomplete="off"
	placeholder="Search projects…"
	value={params.q}
	oninput={(e) => params.update({ q: e.currentTarget.value })}
/>

<Drawer bind:open={adding}>
	<h2>New project</h2>
	<ProjectForm onsuccess={() => (adding = false)} />
</Drawer>

<div class="drawer">
	{#each projects as project, i (project.id)}
		<Folder {project} pos={i % 3} />
	{/each}
</div>

{#if projects.length === 0}
	<Empty>
		{#if params.q}
			No projects match “{params.q}”.
		{:else}
			No projects yet. Create one to start filing todos.
		{/if}
	</Empty>
{/if}

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	.search {
		font: inherit;
		width: 100%;
		max-width: 22em;
		margin-bottom: 1.75em;
		padding: 0.45em 0.7em;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: var(--ink);
	}

	.search:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.drawer {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16em, 1fr));
		gap: 1.25em;
	}
</style>
