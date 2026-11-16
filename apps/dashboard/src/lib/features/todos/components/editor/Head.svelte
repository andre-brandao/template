<!-- The record header on the todo's own route: every fact edits in place, the status rides a
     stepper, and one primary action moves it a step along the flow. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Button, Inline } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import Steps from '#lib/components/Steps.svelte';
	import Source from '#lib/features/events/components/Source.svelte';
	import { fmt } from '#lib/utils/fmt.ts';
	import { update } from '../../api/todos.query';
	import { FLOW, next, step } from '../../status';
	import Assignee from '../Assignee.svelte';
	import Dates from '../Dates.svelte';
	import StatusPicker from '../StatusPicker.svelte';
	import More from './More.svelte';
	import Stage from './Stage.svelte';

	let { todo, onremove }: { todo: Todo.Info; onremove: () => void } = $props();

	const f = fmt();
	const save = update();
	const move = update();
	const ahead = $derived(next(todo.status));
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

{#snippet title()}
	<Inline
		label="Todo title"
		required
		flush
		value={todo.title}
		onsave={(text) => save.mutateAsync({ path: { id: todo.id }, body: { title: text } })}
	/>
{/snippet}

{#snippet actions()}
	{#if ahead}
		<Button
			variant="primary"
			pending={move.isPending}
			onclick={() =>
				move.mutate({
					path: { id: todo.id },
					body: { status: ahead.to, reason: ahead.to === 'done' ? 'completed' : null }
				})}
		>
			{ahead.label}
		</Button>
	{/if}
	<More {todo} {onremove} />
{/snippet}

<Header.Root {title} eyebrow={parent} {actions}>
	<Header.Item label="Status">
		<Steps steps={FLOW.length} current={step(todo.status)} danger={todo.status === 'blocked'}>
			<StatusPicker {todo} />
		</Steps>
	</Header.Item>
	<Header.Item label="Assignee"><Assignee {todo} full /></Header.Item>
	<Header.Item label="Stage"><Stage {todo} /></Header.Item>
	<Header.Item label="Dates"><Dates {todo} /></Header.Item>
	{#if todo.timeStarted}
		<!-- Stamped by the status flow, so it reads rather than edits. -->
		<Header.Item label="Worked">
			{f.date(todo.timeStarted)}
			{#if todo.timeDone}&rarr; {f.date(todo.timeDone)}{/if}
		</Header.Item>
	{/if}
</Header.Root>
