<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue, toast } from '@template/ui';
	import { invalidate } from '#lib/query.ts';
	import { saveWorkspace } from '../api/workspaces.remote';

	// `multi` shows the slug: single mode has one workspace and nothing to address it by.
	let {
		workspace,
		multi,
		disabled = false
	}: {
		workspace: { id: string; name: string; slug: string };
		multi: boolean;
		disabled?: boolean;
	} = $props();

	const save = $derived(saveWorkspace.for(workspace.id));
	const issues = $derived(save.fields.allIssues() ?? []);
</script>

<FormBoundary>
	{#each issues as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		{...save.enhance(async (f) => {
			await f.submit();
			await invalidate(['workspaces']);
			toast.success('Workspace saved');
		})}
	>
		<input {...save.fields.id.as('hidden', workspace.id)} />
		<Field label="Name" style="max-width: 24em">
			<Input {...save.fields.name.as('text', workspace.name)} {disabled} />
		</Field>
		{#if multi}
			<Field label="Slug" style="max-width: 24em">
				<Input {...save.fields.slug.as('text', workspace.slug)} {disabled} />
			</Field>
		{/if}
		{#if !disabled}
			<div>
				<Button variant="primary" type="submit" pending={!!save.pending}>Save</Button>
			</div>
		{/if}
	</form>
</FormBoundary>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
	}
</style>
