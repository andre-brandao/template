<!-- Raised through `modal(TodoForm, { scope, due })`, which passes `close`. -->
<script lang="ts">
	import { Button, Field, Input, Issue, MarkdownEditor } from '@template/ui';
	import { upload } from '$lib/upload';
	import { create } from '../../api/todos.query';
	import TagEditor from '../TagEditor.svelte';
	import AssigneePicker from '../AssigneePicker.svelte';
	import StagePicker from '../StagePicker.svelte';
	import { STATUSES, label } from '../../status';
	import { day, text } from '../../fields';

	let {
		close,
		scope = {},
		due
	}: {
		close: () => void;
		scope?: { source?: string; sourceID?: string };
		/** A `YYYY-MM-DD` the due field starts on, like a clicked calendar day. */
		due?: string;
	} = $props();

	let body = $state('');
	let tags = $state<string[]>([]);
	const save = create({ onSuccess: () => close() });

	function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		save.mutate({
			body: {
				title: String(data.get('title')),
				stage: text(data, 'stage'),
				assignee: text(data, 'assignee'),
				startDate: day(data, 'startDate'),
				dueDate: day(data, 'dueDate'),
				status: STATUSES.find((one) => one === data.get('status')),
				tags: tags.length ? tags : undefined,
				body: body || undefined,
				source: scope.source,
				sourceID: scope.sourceID
			}
		});
	}
</script>

<h2>New todo</h2>

{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

<form class="add" onsubmit={submit}>
	<Field label="Title">
		<Input name="title" placeholder="What needs doing?" required autofocus />
	</Field>

	<div class="pair">
		<Field label="Stage">
			<StagePicker {scope} name="stage" />
		</Field>

		<Field label="Assignee">
			<AssigneePicker name="assignee" />
		</Field>
	</div>

	<div class="pair">
		<Field label="Start">
			<Input type="date" name="startDate" />
		</Field>

		<Field label="Due">
			<Input type="date" name="dueDate" value={due} />
		</Field>
	</div>

	<Field label="Status">
		<select name="status">
			{#each STATUSES as status (status)}
				<option value={status}>{label(status)}</option>
			{/each}
		</select>
	</Field>

	<Field label="Tags" as="div">
		<TagEditor bind:tags />
	</Field>

	<Field label="Description" as="div">
		<MarkdownEditor bind:value={body} {upload} />
	</Field>

	<div class="footer">
		<Button variant="ghost" type="button" onclick={close}>Cancel</Button>
		<Button type="submit" pending={save.isPending}>Add todo</Button>
	</div>
</form>

<style>
	.add {
		display: flex;
		flex-direction: column;
		gap: 1em;
			}

	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11em, 1fr));
		gap: 1em;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.05em;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5em;
	}

	select {
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}
</style>
