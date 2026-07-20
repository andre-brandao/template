<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import { MarkdownEditor } from 'carta-md';
	import 'carta-md/default.css';
	import '@cartamd/plugin-attachment/default.css';
	import '$lib/markdown.css';
	import { createCarta } from '$lib/markdown';
	import { createTodo } from '../../api/todos.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();

	const carta = createCarta();
	let body = $state('');
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
			onsuccess?.();
		})}
	>
		<div class="row">
			<Input placeholder="What needs doing?" {...createTodo.fields.title.as('text')} />
			<Input class="tags" placeholder="tags, comma, separated" {...createTodo.fields.tags.as('text')} />
			<Button type="submit" pending={!!createTodo.pending}>Add</Button>
		</div>
		<div class="body">
			<MarkdownEditor {carta} bind:value={body} />
			<input type="hidden" {...createTodo.fields.body.as('hidden', body)} />
		</div>
	</form>
</FormBoundary>

<style>
	.add {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		margin-bottom: 1.25em;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6em;
	}

	.body {
		margin: 0.6em 0;
	}

	:global(.tags) {
		flex: 0 1 11em;
	}

	:global(.carta-font-code) {
		font-family: var(--font-mono, monospace);
		font-size: 0.9em;
	}
</style>
