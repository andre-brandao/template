<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { createProject } from '../api/projects.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();
</script>

<FormBoundary>
	{#each createProject.fields.allIssues() ?? [] as issue, i (i)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		class="add"
		{...createProject.enhance(async (f) => {
			await f.submit();
			onsuccess?.();
		})}
	>
		<Field label="Name">
			<Input placeholder="Quarterly close" {...createProject.fields.name.as('text')} />
		</Field>

		<Field label="Description">
			<Input placeholder="What is this for?" {...createProject.fields.description.as('text')} />
		</Field>

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
