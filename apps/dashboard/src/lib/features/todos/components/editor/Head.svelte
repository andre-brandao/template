<!-- The record header on the todo's own route: the way back, then its facts. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import * as Header from '$lib/components/header';
	import Source from '$lib/features/events/components/Source.svelte';
	import { fmt } from '$lib/utils/fmt';
	import StatusPill from '../StatusPill.svelte';
	import { late } from '../../status';

	let { todo }: { todo: Todo.Info } = $props();

	const f = fmt();
</script>

{#snippet parent()}
	{#if todo.source === 'project' && todo.sourceID}
		<a href="/projects/{todo.sourceID}">
			<Source source={todo.source} sourceID={todo.sourceID} fallback="Project" />
		</a>
		<span aria-hidden="true">/</span>
		<a href="/projects/{todo.sourceID}/todos">Todos</a>
	{:else}
		<a href="/todos">Todos</a>
	{/if}
{/snippet}

<Header.Root title={todo.title} eyebrow={parent}>
		<Header.Item label="Status"><StatusPill status={todo.status} reason={todo.reason} /></Header.Item>
		<Header.Item label="Assignee">{todo.assignee?.name ?? 'Unassigned'}</Header.Item>
		<Header.Item label="Stage">{todo.stage ?? '—'}</Header.Item>
		<Header.Item label="Due">
			<span class={{ late: late(todo) }}>{todo.dueDate ? f.date(todo.dueDate) : '—'}</span>
		</Header.Item>
</Header.Root>

<style>
	.late {
		color: var(--danger);
	}
</style>
