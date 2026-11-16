<!-- The drawer's facts, since a peek has no header: each field saves on its own through a picker. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import Source from '#lib/features/events/components/Source.svelte';
	import { fmt } from '#lib/utils/fmt.ts';
	import Assignee from '../Assignee.svelte';
	import Day from '../Day.svelte';
	import Stage from './Stage.svelte';

	let { todo }: { todo: Todo.Info } = $props();

	const f = fmt();
</script>

<dl class="plan">
	{#if todo.source === 'project' && todo.sourceID}
		<div>
			<dt>Project</dt>
			<dd>
				<a href="/projects/{todo.sourceID}">
					<Source source={todo.source} sourceID={todo.sourceID} fallback="Project" />
				</a>
			</dd>
		</div>
	{/if}
	<div>
		<dt>Stage</dt>
		<dd><Stage {todo} /></dd>
	</div>
	<div>
		<dt>Assignee</dt>
		<dd><Assignee {todo} full /></dd>
	</div>
	<div>
		<dt>Start</dt>
		<dd><Day {todo} field="startDate" /></dd>
	</div>
	<div>
		<dt>Due</dt>
		<dd><Day {todo} /></dd>
	</div>
	{#if todo.timeStarted}
		<div>
			<dt>Worked</dt>
			<dd>
				{f.date(todo.timeStarted)}
				{#if todo.timeDone}&rarr; {f.date(todo.timeDone)}{/if}
			</dd>
		</div>
	{/if}
</dl>

<style>
	.plan {
		display: grid;
		gap: 0.35em;
		margin: 0;
	}

	.plan div {
		display: grid;
		grid-template-columns: 6em minmax(0, 1fr);
		align-items: center;
		min-height: 2em;
	}

	dt {
		color: var(--muted);
		font-size: 0.86em;
	}

	dd {
		margin: 0;
		color: var(--ink);
	}

	a {
		color: inherit;
	}

	a:hover {
		color: var(--accent);
	}
</style>
