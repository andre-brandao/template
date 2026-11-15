<script lang="ts">
	import { z } from 'zod';
	import { page } from '$app/state';
	import { query } from '$lib/utils/params';
	import { sort } from '../sort';
	import * as Header from '$lib/components/header';
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { Button, Drawer, Empty, Issue, Kbd, Skeleton, Status, modal } from '@template/ui';
	import { list } from '../api/todos.query';
	import Source from '$lib/features/events/components/Source.svelte';
	import { STATUSES } from '../status';
	import TodoForm from '../components/form/TodoForm.svelte';
	import TodoFilters from '../components/TodoFilters.svelte';
	import ViewSelector from '../components/ViewSelector.svelte';
	import GroupSelector from '../components/GroupSelector.svelte';
	import TodosView from '../components/TodosView.svelte';
	import TodoEditor from '../components/TodoEditor.svelte';

	let { source, sourceID }: { source?: string; sourceID?: string } = $props();

	const params = query(
		z.object({
			q: z.string().default(''),
			status: z.enum(['all', ...STATUSES]).default('all'),
			assignee: z.string().default(''),
			stage: z.string().default(''),
			view: z.enum(['list', 'board', 'table', 'timeline']).default('table'),
			group: z.enum(['status', 'stage', 'assignee']).default('status'),
			sort: sort.schema
		})
	);

	const scope = $derived({ source, sourceID });

	const todos = createQuery(() =>
		list({
			...scope,
			status: params.status === 'all' ? undefined : params.status,
			assignee: params.assignee || undefined,
			stage: params.stage || undefined,
			search: params.q || undefined,
			sort: params.sort
		})
	);

	const add = () => modal(TodoForm, { scope });
	createHotkey('C', add);

	const filtered = $derived(
		!!(params.q || params.assignee || params.stage) || params.status !== 'all'
	);
	const clear = () =>
		params.update({ q: undefined, status: undefined, assignee: undefined, stage: undefined });
</script>

<!-- Scoped to a project, the project rides above the title as the way back. -->
{#snippet parent()}
	<a href="/projects/{sourceID}"><Source {source} {sourceID} fallback="Project" /></a>
{/snippet}

<Header.Root title="Todos" eyebrow={source && sourceID ? parent : undefined}>
	{#snippet actions()}
		{#if todos.isFetching && !todos.isPending}<Status state="pending" />{/if}
		<ViewSelector view={params.view} onchange={(view) => params.update({ view })} />
		<Button variant="primary" onclick={add}>New todo <Kbd keys="C" /></Button>
	{/snippet}
	{#snippet strip()}
		<TodoFilters
			{scope}
			filters={{
				status: params.status,
				assignee: params.assignee,
				stage: params.stage,
				search: params.q
			}}
			onchange={(next) =>
				params.update({
					status: next.status,
					assignee: next.assignee,
					stage: next.stage,
					q: next.search
				})}
		>
			{#if params.view === 'board' || params.view === 'timeline'}
				<GroupSelector by={params.group} onchange={(group) => params.update({ group })} />
			{/if}
		</TodoFilters>
	{/snippet}
</Header.Root>

<!-- Shallow-routed by `peek`: the URL reads /todos/[id] but this list stays mounted,
     so closing (or swiping back) lands right back on the filtered view. -->
<!-- Guarded: when the browser Back button closed the drawer, the entry is already
     popped and `selected` is gone — backing again would leave the page entirely. -->
<Drawer open={!!page.state.selected} onclose={() => page.state.selected && history.back()}>
	{#if page.state.selected}
		<TodoEditor id={page.state.selected} onremove={() => history.back()} />
	{/if}
</Drawer>

{#if todos.isPending}
	<div class="skeleton">
		{#each [0, 1, 2, 3, 4, 5] as i (i)}
			<Skeleton h="2.6em" />
		{/each}
	</div>
{:else if todos.isError}
	<Issue>{todos.error.message}</Issue>
{:else if todos.data.data.length === 0}
	{#if filtered}
		<Empty>
			No todos match these filters.
			{#snippet action()}
				<Button variant="ghost" onclick={clear}>Clear filters</Button>
			{/snippet}
		</Empty>
	{:else}
		<Empty>
			No todos yet.
			{#snippet action()}
				<Button onclick={add}>New todo <Kbd keys="C" /></Button>
			{/snippet}
		</Empty>
	{/if}
{:else}
	<TodosView todos={todos.data.data} view={params.view} by={params.group} />
{/if}

<style>
	.skeleton {
		display: grid;
		gap: 0.35em;
	}
</style>
