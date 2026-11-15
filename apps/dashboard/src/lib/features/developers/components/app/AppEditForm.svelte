<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue, toast } from '@template/ui';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import { renameApp } from '../../api/apps.remote';

	// A bot's name and avatar, edited by an admin. `onchange` is the profile around it.
	let {
		id,
		name,
		image,
		onchange
	}: { id: string; name: string; image: string | null; onchange?: () => void } = $props();

	const rename = $derived(renameApp.for(id));
</script>

<div class="head">
	<AvatarUpload {name} {image} url="/avatars/user/{id}" size={56} {onchange} />
</div>

<FormBoundary>
	{#each rename.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		{...rename.enhance(async (f) => {
			await f.submit();
			toast.success('Name saved');
		})}
	>
		<input {...rename.fields.id.as('hidden', id)} />
		<Field label="Name" style="max-width: 24em">
			<div class="row">
				<Input {...rename.fields.name.as('text', name)} />
				<Button type="submit" pending={!!rename.pending}>Save</Button>
			</div>
		</Field>
	</form>
</FormBoundary>

<style>
	.head {
		margin-bottom: 1em;
	}

	.row {
		display: flex;
		gap: 0.4em;
	}
</style>
