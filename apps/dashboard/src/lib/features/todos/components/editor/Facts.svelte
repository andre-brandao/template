<!-- Read-only facts, laid out like `Plan` under it; the planned dates are its Start and Due. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import Source from '$lib/features/events/components/Source.svelte';
	import { fmt } from '$lib/utils/fmt';

	let { todo }: { todo: Todo.Info } = $props();

	const f = fmt();
</script>

<dl class="facts">
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
		<dt>Worked</dt>
		<dd>
			{todo.timeStarted ? f.date(todo.timeStarted) : 'Not started'}
			{#if todo.timeDone}&rarr; {f.date(todo.timeDone)}{/if}
		</dd>
	</div>
</dl>

<style>
	.facts {
		display: grid;
		gap: 0.35em;
		margin: 0;
	}

	.facts div {
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
