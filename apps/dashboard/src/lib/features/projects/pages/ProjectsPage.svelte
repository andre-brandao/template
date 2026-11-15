<script lang="ts">
	import type { Snippet } from 'svelte';
	import { z } from 'zod';
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { hotkeys } from '#lib/hotkeys.ts';
	import { query } from '#lib/utils/params.ts';
	import { debounce } from '#lib/utils/debounce.ts';
	import { Button, Empty, Input, Issue, Kbd, List, modal } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
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

	createHotkey(hotkeys.create, add);
	createHotkey(hotkeys.search, () => search?.focus());
</script>

<Header.Root title="Projects" lead="Each project files its own todos, stages and insights.">
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
				<Button variant="ghost" onclick={() => params.update({ q: undefined })}>Clear search</Button
				>
			</Header.Group>
		{/if}
	{/snippet}
</Header.Root>

{#if projects.isPending}
	<List.Loading rows={4} />
{:else if projects.isError}
	<Issue retry={() => projects.refetch()}>{projects.error.message}</Issue>
{:else if projects.data.data.length === 0}
	{#if params.q}
		<Empty>
			No projects match “{params.q}”.
			{#snippet action()}
				<Button variant="ghost" onclick={() => params.update({ q: undefined })}>Clear search</Button
				>
			{/snippet}
		</Empty>
	{:else}
		<Empty>No projects yet. Press <Kbd keys="C" /> to create one and start filing todos.</Empty>
	{/if}
{:else}
	<List.Root label="Projects">
		{#each projects.data.data as project (project.id)}
			<Row {project} />
		{/each}
	</List.Root>
{/if}
