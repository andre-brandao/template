<script lang="ts">
	import { Button, Markdown, MarkdownEditor } from '@template/ui';
	import { upload } from '$lib/upload';
	import type { Todo } from '@template/core/todo';
	import type { updateTodo } from '../../api/todos.remote';

	let {
		todo,
		update,
		onsaved
	}: {
		todo: Todo.Info;
		update: ReturnType<typeof updateTodo.for>;
		onsaved: () => Promise<void>;
	} = $props();


	let editing = $state(false);
	let body = $state('');

	function edit() {
		body = todo.body ?? '';
		editing = true;
	}
</script>

{#if editing}
	<form
		class="edit"
		{...update.enhance(async (f) => {
			await f.submit();
			await onsaved();
			editing = false;
		})}
	>
		<input {...update.fields.id.as('hidden', todo.id)} />
		<MarkdownEditor bind:value={body} {upload} />
		<input {...update.fields.body.as('hidden', body)} />
		<div class="edit-actions">
			<Button type="submit" pending={!!update.pending}>Save</Button>
			<Button variant="ghost" type="button" onclick={() => (editing = false)}>Cancel</Button>
		</div>
	</form>
{:else}
	{#if todo.body}
		<div class="body">
			<Markdown value={todo.body} />
		</div>
	{:else}
		<p class="empty-body">No description yet.</p>
	{/if}
	<Button variant="ghost" onclick={edit}>
		{todo.body ? 'Edit description' : 'Add description'}
	</Button>
{/if}

<style>
	.body {
		margin-top: 1em;
	}

	.empty-body {
		color: var(--dim);
		font-size: 0.9em;
		font-style: italic;
		margin: 1em 0 0;
	}

	.edit {
		margin-top: 1em;
	}

	.edit-actions {
		display: flex;
		gap: 0.5em;
		margin-top: 0.6em;
	}
</style>
