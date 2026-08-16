<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import type { Storage } from '@template/core/storage';
	import { renameFile } from '../api/files.remote';

	let { file, onsuccess }: { file: Storage.Entry; onsuccess?: () => void } = $props();

	const name = $derived(file.key.split('/').at(-1) ?? file.key);
	const rename = $derived(renameFile.for(file.key));
</script>

<FormBoundary>
	{#each rename.fields.allIssues() ?? [] as issue, i (i)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		class="edit"
		{...rename.enhance(async (f) => {
			await f.submit();
			onsuccess?.();
		})}
	>
		<input {...rename.fields.name.as('hidden', name)} />

		<Field label="Name">
			<Input {...rename.fields.to.as('text', name)} />
		</Field>

		<div class="footer">
			<Button type="submit" pending={!!rename.pending}>Save</Button>
		</div>
	</form>
</FormBoundary>

<style>
	.edit {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
