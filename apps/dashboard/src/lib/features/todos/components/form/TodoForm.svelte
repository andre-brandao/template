<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import { MarkdownEditor } from 'carta-md';
	import 'carta-md/default.css';
	import '@cartamd/plugin-attachment/default.css';
	import '$lib/markdown.css';
	import { createCarta } from '$lib/markdown';
	import { createTodo } from '../../api/todos.remote';
	import TagEditor from '../TagEditor.svelte';

	let { onsuccess }: { onsuccess?: () => void } = $props();

	const carta = createCarta();
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

		<div class="field">
			<span>Tags</span>
			<TagEditor bind:tags />
			<input type="hidden" {...createTodo.fields.tags.as('hidden', tags.join(','))} />
		</div>

		<div class="field">
			<span>Description</span>
			<MarkdownEditor {carta} bind:value={body} />
			<input type="hidden" {...createTodo.fields.body.as('hidden', body)} />
		</div>

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

	.footer {
		display: flex;
		justify-content: flex-end;
	}

	:global(.carta-font-code) {
		font-family: var(--font-mono, monospace);
		font-size: 0.9em;
	}
</style>
