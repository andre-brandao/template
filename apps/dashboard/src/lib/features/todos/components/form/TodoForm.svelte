<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue, MarkdownEditor } from '@template/ui';
	import { upload } from '$lib/upload';
	import { createTodo } from '../../api/todos.remote';
	import TagEditor from '../TagEditor.svelte';
	import AssigneePicker from '../AssigneePicker.svelte';
	import StagePicker from '../StagePicker.svelte';
	import { STATUSES, label } from '../../status';

	let {
		onsuccess,
		scope = {},
		due
	}: {
		onsuccess?: () => void;
		scope?: { source?: string; sourceID?: string };
		/** Prefilled when the form opens from a calendar day. */
		due?: string;
	} = $props();

	let body = $state('');
	let tags = $state<string[]>([]);
</script>

<FormBoundary>
	{#each createTodo.fields.allIssues() ?? [] as issue, i (i)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		class="add"
		{...createTodo.enhance(async (f) => {
			await f.submit();
			body = '';
			tags = [];
			onsuccess?.();
		})}
	>
		<Field label="Title">
			<Input placeholder="What needs doing?" {...createTodo.fields.title.as('text')} />
		</Field>

		<div class="pair">
			<Field label="Stage">
				<StagePicker {scope} {...createTodo.fields.stage.as('text')} />
			</Field>

			<Field label="Assignee">
				<AssigneePicker {...createTodo.fields.assignee.as('select')} />
			</Field>
		</div>

		<div class="pair">
			<Field label="Start">
				<Input {...createTodo.fields.startDate.as('date')} />
			</Field>

			<Field label="Due">
				<!-- Static, so it seeds the field without fighting what gets typed after. -->
				<Input {...createTodo.fields.dueDate.as('date', due)} />
			</Field>
		</div>

		<Field label="Status">
			<select {...createTodo.fields.status.as('select')}>
				{#each STATUSES as status (status)}
					<option value={status}>{label(status)}</option>
				{/each}
			</select>
		</Field>

		<Field label="Tags" as="div">
			<TagEditor bind:tags />
			<input {...createTodo.fields.tags.as('hidden', tags.join(','))} />
		</Field>

		<Field label="Description" as="div">
			<MarkdownEditor bind:value={body} {upload} />
			<input {...createTodo.fields.body.as('hidden', body)} />
		</Field>

		<input {...createTodo.fields.source.as('hidden', scope.source ?? '')} />
		<input {...createTodo.fields.sourceID.as('hidden', scope.sourceID ?? '')} />

		<div class="footer">
			<Button type="submit" pending={!!createTodo.pending}>Add todo</Button>
		</div>
	</form>
</FormBoundary>

<style>
	.add {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin-bottom: 1.25em;
	}

	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11em, 1fr));
		gap: 1em;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
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
