<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import type { File } from '@template/core/file';
	import TagEditor from '$lib/features/todos/components/TagEditor.svelte';
	import { updateFile } from '../api/files.remote';

	let { file, onsuccess }: { file: File.Info; onsuccess?: () => void } = $props();

	const update = $derived(updateFile.for(file.id));
	// Writable derived: edits override it, a different file resnaps it.
	let tags = $derived([...file.tags]);
</script>

<FormBoundary>
	{#each update.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<form
		class="edit"
		{...update.enhance(async (f) => {
			await f.submit();
			onsuccess?.();
		})}
	>
		<input {...update.fields.id.as('hidden', file.id)} />

		<label class="field">
			<span>Name</span>
			<Input {...update.fields.filename.as('text')} value={file.filename} />
		</label>

		<div class="field">
			<span>Tags</span>
			<TagEditor bind:tags />
			<input {...update.fields.tags.as('hidden', tags.join(','))} />
		</div>

		<div class="footer">
			<Button type="submit" pending={!!update.pending}>Save</Button>
		</div>
	</form>
</FormBoundary>

<style>
	.error {
		margin: 0 0 0.5em;
		color: var(--danger, crimson);
		font-size: 0.85em;
	}

	.edit {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
	}

	.field span {
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--muted);
	}

	.footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
