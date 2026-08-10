<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import type { Storage } from '@template/core/storage';
	import { renameFile } from '../api/files.remote';

	let { file, onsuccess }: { file: Storage.Entry; onsuccess?: () => void } = $props();

	const name = $derived(file.key.split('/').at(-1) ?? file.key);
	const rename = $derived(renameFile.for(file.key));
</script>

<FormBoundary>
	{#each rename.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<form
		class="edit"
		{...rename.enhance(async (f) => {
			await f.submit();
			onsuccess?.();
		})}
	>
		<input {...rename.fields.name.as('hidden', name)} />

		<label class="field">
			<span>Name</span>
			<Input {...rename.fields.to.as('text', name)} />
		</label>

		<div class="footer">
			<Button type="submit" pending={!!rename.pending}>Save</Button>
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
