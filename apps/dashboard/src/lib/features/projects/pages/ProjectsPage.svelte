<script lang="ts">
	import type { Snippet } from 'svelte';
	import { z } from 'zod';
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '$lib/utils/params';
	import { debounce } from '$lib/utils/debounce';
	import { Button, Drawer, Empty, Input, Issue, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import Folder from '../components/Folder.svelte';
	import ProjectForm from '../components/ProjectForm.svelte';
	import { list } from '../api/projects.query';

	// `extra` is a secondary action another slice brings, like the GitHub import.
	let { extra }: { extra?: Snippet } = $props();

	const params = query(z.object({ q: z.string().default('') }));
	const projects = createQuery(() => list(params.q));
	const commit = debounce((q: string) => params.update({ q: q || undefined }), 300);

	let adding = $state(false);
</script>

<Header.Root title="Projects" lead="Each project files its own todos, stages and insights.">
	<Header.Item label="Projects">{projects.data?.data.length ?? '–'}</Header.Item>
	{#snippet actions()}
		{@render extra?.()}
		<Button onclick={() => (adding = true)}>New project</Button>
	{/snippet}
	{#snippet strip()}
		<Header.Group>
			<Input
				type="search"
				name="search"
				autocomplete="off"
				aria-label="Search projects"
				placeholder="Search projects…"
				value={params.q}
				oninput={(e) => commit(e.currentTarget.value)}
			/>
		</Header.Group>
		{#if params.q}
			<Header.Group end>
				<Button variant="ghost" onclick={() => params.update({ q: undefined })}>Clear filters</Button>
			</Header.Group>
		{/if}
	{/snippet}
</Header.Root>

<Drawer bind:open={adding}>
	<h2>New project</h2>
	<ProjectForm onsuccess={() => (adding = false)} />
</Drawer>

{#if projects.isPending}
	<div class="drawer">
		{#each [0, 1, 2] as i (i)}
			<Skeleton h="8em" />
		{/each}
	</div>
{:else if projects.isError}
	<Issue>{projects.error.message}</Issue>
{:else if projects.data.data.length === 0}
	<Empty>
		{#if params.q}
			No projects match “{params.q}”.
		{:else}
			No projects yet. Create one to start filing todos.
		{/if}
	</Empty>
{:else}
	<div class="drawer">
		{#each projects.data.data as project, i (project.id)}
			<Folder {project} pos={i % 3} />
		{/each}
	</div>
{/if}

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	.drawer {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16em, 1fr));
		gap: 1.25em;
		/* Folder tabs stand proud of their card; leave them room under the header. */
		padding-top: 0.75em;
	}
</style>
