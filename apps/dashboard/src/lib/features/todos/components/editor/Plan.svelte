<!-- The scheduling fields, each saved on its own: stage inline, the rest through pickers. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Inline } from '@template/ui';
	import { update } from '../../api/todos.query';
	import Assignee from '../Assignee.svelte';
	import Day from '../Day.svelte';

	let { todo }: { todo: Todo.Info } = $props();

	const save = update();
</script>

<dl class="plan">
	<div>
		<dt>Stage</dt>
		<dd>
			<Inline
				label="Stage"
				placeholder="No stage"
				value={todo.stage ?? ''}
				onsave={(next) =>
					save.mutateAsync({ path: { id: todo.id }, body: { stage: next.trim() || null } })}
			/>
		</dd>
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
</dl>

<style>
	.plan {
		display: grid;
		gap: 0.35em;
		margin: 1em 0 0;
		padding-top: 1em;
		border-top: 1px solid var(--border);
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
	}
</style>
