<script lang="ts">
	import { Button, Markdown, MarkdownEditor } from '@template/ui';
	import { upload } from '$lib/upload';
	import type { Todo } from '@template/core/todo';

	let {
		todo,
		pending,
		onsave
	}: {
		todo: Todo.Info;
		pending: boolean;
		onsave: (body: string) => Promise<unknown>;
	} = $props();

	let editing = $state(false);
	let body = $state('');

	function edit() {
		body = todo.body ?? '';
		editing = true;
	}

	// A failed save keeps the draft open; the caller shows the error.
	function submit(e: SubmitEvent) {
		e.preventDefault();
		onsave(body).then(
			() => (editing = false),
			() => {}
		);
	}
</script>

{#if editing}
	<form class="edit" onsubmit={submit}>
		<MarkdownEditor bind:value={body} {upload} />
		<div class="row">
			<Button type="submit" {pending}>Save</Button>
			<Button variant="ghost" type="button" onclick={() => (editing = false)}>Cancel</Button>
		</div>
	</form>
{:else}
	{#if todo.body}
		<div class="body">
			<Markdown value={todo.body} />
		</div>
	{:else}
		<p class="blank">No description yet.</p>
	{/if}
	<Button variant="ghost" onclick={edit}>
		{todo.body ? 'Edit description' : 'Add description'}
	</Button>
{/if}

<style>
	.body {
		margin-top: 1em;
	}

	.blank {
		color: var(--dim);
		font-size: 0.9em;
		font-style: italic;
		margin: 1em 0 0;
	}

	.edit {
		margin-top: 1em;
	}

	.row {
		display: flex;
		gap: 0.5em;
		margin-top: 0.6em;
	}
</style>
