<!-- Raised through `modal(TodoForm, { scope, due })`, which passes `close`. -->
<script lang="ts">
	import {
		Button,
		DateSpanPicker,
		Field,
		Input,
		Issue,
		MarkdownEditor,
		Select,
		fromDay
	} from '@template/ui';
	import { upload } from '#lib/upload.ts';
	import { fmt } from '#lib/utils/fmt.ts';
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

	const f = fmt();
	let body = $state('');
	let tags = $state<string[]>([]);
	let start = $state<string>();
	let finish = $derived(due && fromDay(due, f.zone));
	const save = create({ onSuccess: () => close() });

	function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		save.mutate({
			body: {
				title: String(data.get('title')),
				stage: text(data, 'stage'),
				assignee: text(data, 'assignee'),
				startDate: day(data, 'startDate', f.zone),
				dueDate: day(data, 'dueDate', f.zone),
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
		<!-- `div`, not the default label: a label wrapping the trigger would toggle it twice. -->
		<Field label="Stage" as="div">
			<StagePicker {scope} name="stage" />
		</Field>

		<Field label="Assignee" as="div">
			<AssigneePicker name="assignee" />
		</Field>
	</div>

	<Field label="Dates" as="div">
		<DateSpanPicker
			bind:start
			bind:finish
			startName="startDate"
			finishName="dueDate"
			label="Todo dates"
			time
		/>
	</Field>

	<Field label="Status">
		<Select name="status" options={STATUSES.map((one) => ({ value: one, label: label(one) }))} />
	</Field>

	<Field label="Tags" as="div">
		<TagEditor bind:tags />
	</Field>

	<Field label="Description" as="div">
		<MarkdownEditor bind:value={body} {upload} />
	</Field>

	<div class="footer">
		<Button variant="ghost" type="button" onclick={close}>Cancel</Button>
		<Button variant="primary" type="submit" pending={save.isPending}>Add todo</Button>
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
</style>
