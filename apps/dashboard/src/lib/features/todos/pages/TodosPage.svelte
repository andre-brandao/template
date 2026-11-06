<script lang="ts">
	import { z } from 'zod';
	import { page } from '$app/state';
	import { query } from '$lib/utils/params';
	import { sort } from '../sort';
	import * as Header from '$lib/components/header';
	import { Button, Drawer } from '@template/ui';
	import { getTodos } from '../api/todos.remote';
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

	const todos = $derived(
		await getTodos({
			...scope,
			status: params.status === 'all' ? undefined : params.status,
			assignee: params.assignee || undefined,
			stage: params.stage || undefined,
			q: params.q || undefined,
			sort: params.sort
		})
	);

	let adding = $state(false);
</script>

<!-- Scoped to a project, the project rides above the title as the way back. -->
{#snippet parent()}
	<a href="/projects/{sourceID}"><Source {source} {sourceID} fallback="Project" /></a>
{/snippet}

<Header.Root title="Todos" eyebrow={source && sourceID ? parent : undefined}>
	{#snippet actions()}
		<ViewSelector view={params.view} onchange={(view) => params.update({ view })} />
		<Button onclick={() => (adding = true)}>New todo</Button>
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

<Drawer bind:open={adding}>
	<h2>New todo</h2>
	<TodoForm {scope} onsuccess={() => (adding = false)} />
</Drawer>

<!-- Shallow-routed by `peek`: the URL reads /todos/[id] but this list stays mounted,
     so closing (or swiping back) lands right back on the filtered view. -->
<!-- Guarded: when the browser Back button closed the drawer, the entry is already
     popped and `selected` is gone — backing again would leave the page entirely. -->
<Drawer open={!!page.state.selected} onclose={() => page.state.selected && history.back()}>
	{#if page.state.selected}
		<TodoEditor id={page.state.selected} onremove={() => history.back()} />
	{/if}
</Drawer>

<TodosView {todos} view={params.view} by={params.group} />

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}
</style>
