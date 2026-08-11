<script lang="ts">
	import { Button, FormBoundary, Input } from '@template/ui';
	import { createProject } from '../api/projects.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();
</script>

<FormBoundary>
	{#each createProject.fields.allIssues() ?? [] as issue, i (i)}
		<p class="error">{issue.message}</p>
	{/each}

	<form
		class="add"
		{...createProject.enhance(async (f) => {
			await f.submit();
			onsuccess?.();
		})}
	>
		<label class="field">
			<span>Name</span>
			<Input placeholder="Quarterly close" {...createProject.fields.name.as('text')} />
		</label>

		<label class="field">
			<span>Description</span>
			<Input placeholder="What is this for?" {...createProject.fields.description.as('text')} />
		</label>

		<div class="footer">
			<Button type="submit" pending={!!createProject.pending}>Add project</Button>
		</div>
	</form>
</FormBoundary>

<style>
	.add {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.footer {
		display: flex;
		justify-content: flex-end;
	}
</style>
