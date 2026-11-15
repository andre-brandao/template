<script lang="ts">
	import type { Snippet } from 'svelte';
	import { z } from 'zod';
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { query } from '$lib/utils/params';
	import { debounce } from '$lib/utils/debounce';
	import { Button, Empty, Input, Issue, Kbd, Skeleton, modal } from '@template/ui';
	import * as Header from '$lib/components/header';
	import ProjectForm from '../components/ProjectForm.svelte';
	import Row from '../components/Row.svelte';
	import { list } from '../api/projects.query';

	// `extra` is a secondary action another slice brings, like the GitHub import.
	let { extra }: { extra?: Snippet } = $props();

	const params = query(z.object({ q: z.string().default('') }));
	const projects = createQuery(() => list(params.q));
	const commit = debounce((q: string) => params.update({ q: q || undefined }), 300);

	let search: HTMLInputElement | undefined;

	const add = () => modal(ProjectForm);

	createHotkey('C', add);
	createHotkey('/', () => search?.focus());
</script>

<Header.Root title="Projects" lead="Each project files its own todos, stages and insights.">
	<Header.Item label="Projects">{projects.data?.total ?? '–'}</Header.Item>
	{#snippet actions()}
		{@render extra?.()}
		<Button variant="primary" onclick={add}>New project <Kbd keys="C" /></Button>
	{/snippet}
	{#snippet strip()}
		<Header.Group>
			<Input
				type="search"
				name="search"
				autocomplete="off"
				aria-label="Search projects"
				aria-keyshortcuts="/"
				placeholder="Search projects…"
				value={params.q}
				oninput={(e) => commit(e.currentTarget.value)}
				{@attach (el: HTMLInputElement) => {
					search = el;
				}}
			/>
		</Header.Group>
		{#if params.q}
			<Header.Group end>
				<Button variant="ghost" onclick={() => params.update({ q: undefined })}>Clear filters</Button>
			</Header.Group>
		{/if}
	{/snippet}
</Header.Root>

{#if projects.isPending}
	<div class="skeleton">
		{#each [0, 1, 2, 3] as i (i)}
			<Skeleton h="3.25em" />
		{/each}
	</div>
{:else if projects.isError}
	<Issue>{projects.error.message}</Issue>
{:else if projects.data.data.length === 0}
	{#if params.q}
		<Empty>
			No projects match “{params.q}”.
			{#snippet action()}
				<Button variant="ghost" onclick={() => params.update({ q: undefined })}>Clear search</Button>
			{/snippet}
		</Empty>
	{:else}
		<Empty>
			No projects yet. Create one to start filing todos.
			{#snippet action()}
				<Button onclick={add}>New project <Kbd keys="C" /></Button>
			{/snippet}
		</Empty>
	{/if}
{:else}
	<ul>
		{#each projects.data.data as project (project.id)}
			<Row {project} />
		{/each}
	</ul>
{/if}

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--border);
	}

	.skeleton {
		display: grid;
		gap: 0.35em;
	}
</style>
