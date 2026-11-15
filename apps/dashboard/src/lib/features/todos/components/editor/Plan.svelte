<!-- The scheduling fields, saved together. -->
<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Button, Field, Input, Issue } from '@template/ui';
	import { update } from '../../api/todos.query';
	import { day, text } from '../../fields';
	import AssigneePicker from '../AssigneePicker.svelte';
	import StagePicker from '../StagePicker.svelte';

	let { todo }: { todo: Todo.Info } = $props();

	const save = update();
	const scope = $derived({
		source: todo.source ?? undefined,
		sourceID: todo.sourceID ?? undefined
	});
	const date = (at: string | null) => at?.slice(0, 10) ?? '';

	function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		save.mutate({
			path: { id: todo.id },
			body: {
				stage: text(data, 'stage') ?? null,
				assignee: text(data, 'assignee') ?? null,
				startDate: day(data, 'startDate') ?? null,
				dueDate: day(data, 'dueDate') ?? null
			}
		});
	}
</script>

{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

<form class="plan" onsubmit={submit}>
	<Field label="Stage">
		<StagePicker {scope} name="stage" value={todo.stage ?? ''} />
	</Field>
	<Field label="Assignee">
		<AssigneePicker
			name="assignee"
			selected={todo.assignee}
			value={todo.assignee?.id ?? ''}
		/>
	</Field>
	<div class="pair">
		<Field label="Start">
			<Input type="date" name="startDate" value={date(todo.startDate)} />
		</Field>
		<Field label="Due">
			<Input type="date" name="dueDate" value={date(todo.dueDate)} />
		</Field>
	</div>
	<Button type="submit" variant="secondary" pending={save.isPending}>Save plan</Button>
</form>

<style>
	.plan {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.75em;
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--border);
	}

	.plan .pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8em, 1fr));
		gap: 0.75em;
	}
</style>
