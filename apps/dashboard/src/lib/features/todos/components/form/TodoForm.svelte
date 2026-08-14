<script lang="ts">
	import { Button, FormBoundary, Input, MarkdownEditor } from '@template/ui';
	import { upload } from '$lib/upload';
	import { createTodo } from '../../api/todos.remote';
	import TagEditor from '../TagEditor.svelte';
	import AssigneePicker from '../AssigneePicker.svelte';
	import StagePicker from '../StagePicker.svelte';
	import { STATUSES, label } from '../../status';

	let {
		onsuccess,
		scope = {}
	}: { onsuccess?: () => void; scope?: { source?: string; sourceID?: string } } = $props();

	let body = $state('');
	let tags = $state<string[]>([]);
</script>

<FormBoundary>
	{#each createTodo.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
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
		<label class="field">
			<span>Title</span>
			<Input placeholder="What needs doing?" {...createTodo.fields.title.as('text')} />
		</label>

		<div class="pair">
			<label class="field">
				<span>Stage</span>
				<StagePicker {scope} {...createTodo.fields.stage.as('text')} />
			</label>

			<label class="field">
				<span>Assignee</span>
				<AssigneePicker {...createTodo.fields.assignee.as('select')} />
			</label>
		</div>

		<div class="pair">
			<label class="field">
				<span>Start</span>
				<Input {...createTodo.fields.startDate.as('date')} />
			</label>

			<label class="field">
				<span>Due</span>
				<Input {...createTodo.fields.dueDate.as('date')} />
			</label>
		</div>

		<label class="field">
			<span>Status</span>
			<select {...createTodo.fields.status.as('select')}>
				{#each STATUSES as status (status)}
					<option value={status}>{label(status)}</option>
				{/each}
			</select>
		</label>

		<div class="field">
			<span>Tags</span>
			<TagEditor bind:tags />
			<input {...createTodo.fields.tags.as('hidden', tags.join(','))} />
		</div>

		<div class="field">
			<span>Description</span>
			<MarkdownEditor bind:value={body} {upload} />
			<input {...createTodo.fields.body.as('hidden', body)} />
		</div>

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
