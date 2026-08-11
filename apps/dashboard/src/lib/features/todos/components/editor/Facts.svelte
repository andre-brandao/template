<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { late } from '../../status';
	import { fmt } from '$lib/utils/fmt';

	let { todo }: { todo: Todo.Info } = $props();

	const f = fmt();
</script>

<dl class="facts">
	<div>
		<dt>Planned</dt>
		<dd class:late={late(todo)}>
			{todo.startDate ? f.date(todo.startDate) : '—'} → {todo.dueDate
				? f.date(todo.dueDate)
				: '—'}
		</dd>
	</div>
	<div>
		<dt>Actual</dt>
		<dd>
			{todo.timeStarted ? f.date(todo.timeStarted) : 'not started'}
			{#if todo.timeDone}&rarr; {f.date(todo.timeDone)}{/if}
		</dd>
	</div>
	{#if todo.source === 'project' && todo.sourceID}
		<div><dt>Project</dt><dd><a href="/projects/{todo.sourceID}">open</a></dd></div>
	{/if}
</dl>

<style>
	.facts {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
		margin: 0;
	}

	dt {
		font-family: var(--font-mono);
		font-size: 0.68em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dim);
	}

	dd {
		margin: 0.2em 0 0;
		font-size: 0.88em;
		color: var(--muted);
	}

	dd.late {
		color: var(--danger);
	}
</style>
