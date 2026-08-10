<script lang="ts">
	import { z } from 'zod';
	import { page } from '$app/state';
	import { query } from '$lib/utils/params';
	import { Button, Drawer } from '@template/ui';
	import { getTodos } from '../api/todos.remote';
	import { getSource } from '$lib/features/events/api/sources.remote';
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
			group: z.enum(['status', 'stage', 'assignee']).default('status')
		})
	);

	const scope = $derived({ source, sourceID });

	// Both queries are kicked off together — awaiting them in sequence would make the
	// source name a waterfall in front of the todos it labels.
	const data = $derived(
		await Promise.all([
			getTodos({
				...scope,
				status: params.status === 'all' ? undefined : params.status,
				assignee: params.assignee || undefined,
				stage: params.stage || undefined,
				q: params.q || undefined
			}),
			source && sourceID ? getSource({ source, sourceID }) : undefined
		])
	);
	const todos = $derived(data[0]);
	const title = $derived(data[1]?.name ?? 'Todos');

	let adding = $state(false);
</script>

<h1>{title}</h1>

<div class="toolbar">
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
		{#snippet tools()}
			{#if params.view === 'board' || params.view === 'timeline'}
				<GroupSelector by={params.group} onchange={(group) => params.update({ group })} />
			{/if}
			<ViewSelector view={params.view} onchange={(view) => params.update({ view })} />
			<Button onclick={() => (adding = true)}>New todo</Button>
		{/snippet}
	</TodoFilters>
</div>

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
	h1 {
		margin: 0 0 0.75em;
		font-size: 1.4em;
	}

	.toolbar {
		margin-bottom: 1.25em;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}
</style>
