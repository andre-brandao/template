<script lang="ts">
	import { z } from 'zod';
	import { page } from '$app/state';
	import { pushState } from '$app/navigation';
	import { query } from '$lib/utils/params';
	import Header from '$lib/components/Header.svelte';
	import { Button, Drawer, Tabs, toast } from '@template/ui';
	import Source from '$lib/features/events/components/Source.svelte';
	import { STATUSES } from '../status';
	import { grouped, type Move } from '../calendar';
	import { getTodos, moveTodo } from '../api/todos.remote';
	import TodoFilters from '../components/TodoFilters.svelte';
	import GroupSelector from '../components/GroupSelector.svelte';
	import TodoForm from '../components/form/TodoForm.svelte';
	import TodoEditor from '../components/TodoEditor.svelte';
	import TodoCalendar from '../components/calendar/TodoCalendar.svelte';

	let { source, sourceID }: { source?: string; sourceID?: string } = $props();

	const VIEWS = [
		{ key: 'dayGridMonth', label: 'Month' },
		{ key: 'timeGridWeek', label: 'Week' },
		{ key: 'resourceTimeGridDay', label: 'Day' },
		{ key: 'resourceTimelineMonth', label: 'Timeline' },
		{ key: 'listMonth', label: 'List' }
	] as const;

	const params = query(
		z.object({
			q: z.string().default(''),
			status: z.enum(['all', ...STATUSES]).default('all'),
			assignee: z.string().default(''),
			stage: z.string().default(''),
			view: z.enum(VIEWS.map((v) => v.key)).default('dayGridMonth'),
			group: z.enum(['status', 'stage', 'assignee']).default('status')
		})
	);

	const scope = $derived({ source, sourceID });

	const args = $derived({
		...scope,
		status: params.status === 'all' ? undefined : params.status,
		assignee: params.assignee || undefined,
		stage: params.stage || undefined,
		q: params.q || undefined
	});

	const todos = $derived(await getTodos(args));

	// The day a click landed on, prefilled into the form. '' is the toolbar button.
	let adding = $state<string | null>(null);

	function fail() {
		toast.error('That todo could not be rescheduled.');
		return false;
	}

	const move = (next: Move) =>
		moveTodo(next)
			.then(() => getTodos(args).refresh())
			.then(() => true, fail);
</script>

<!-- Header and filters hold still; the calendar takes what they leave. -->
<div class="fill">
	<Header>
		{#snippet title()}<Source {source} {sourceID} fallback="Calendar" />{/snippet}
		{#snippet actions()}
			<Button onclick={() => (adding = '')}>New todo</Button>
		{/snippet}
	</Header>

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
				{#if grouped(params.view)}
					<GroupSelector by={params.group} onchange={(group) => params.update({ group })} />
				{/if}
				<Tabs.Root>
					{#each VIEWS as v (v.key)}
						<Tabs.Item active={params.view === v.key} onclick={() => params.update({ view: v.key })}>
							{v.label}
						</Tabs.Item>
					{/each}
				</Tabs.Root>
			{/snippet}
		</TodoFilters>
	</div>

	<TodoCalendar
		{todos}
		view={params.view}
		by={params.group}
		onopen={(id) => pushState(`/todos/${id}`, { selected: id })}
		onpick={(day) => (adding = day)}
		onmove={move}
	/>
</div>

<Drawer open={adding !== null} onclose={() => (adding = null)}>
	<h2>New todo</h2>
	{#if adding !== null}
		<TodoForm {scope} due={adding} onsuccess={() => (adding = null)} />
	{/if}
</Drawer>

<!-- Shallow-routed like the other views: the URL reads /todos/[id] while this page
     stays mounted, so closing lands back on the same month. -->
<Drawer open={!!page.state.selected} onclose={() => page.state.selected && history.back()}>
	{#if page.state.selected}
		<TodoEditor id={page.state.selected} onremove={() => history.back()} />
	{/if}
</Drawer>

<style>
	/* `--fill` is the viewport minus the shell's topbar and padding — see UsersPage. */
	.fill {
		display: flex;
		flex-direction: column;
		height: var(--fill);
		min-height: 30em;
	}

	.toolbar {
		margin-bottom: 1.25em;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}
</style>
