<script lang="ts">
	import { Button, Field, Input, Issue, toast } from '@template/ui';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import { rename } from '../../api/developers.query';

	// An App's name and avatar, edited by an admin. `onchange` is the profile around it.
	let {
		id,
		name,
		image,
		onchange
	}: { id: string; name: string; image: string | null; onchange?: () => void } = $props();

	// Seeded from the profile and edited locally; a refetched name reseeds it.
	let value = $derived(name);

	const save = rename({
		onSuccess: () => {
			toast.success('Name saved');
			onchange?.();
		}
	});
</script>

<div class="head">
	<AvatarUpload {name} {image} url="/avatars/user/{id}" size={56} {onchange} />
</div>

{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

<form
	onsubmit={(e) => {
		e.preventDefault();
		save.mutate({ path: { id }, body: { name: value } });
	}}
>
	<Field label="Name" style="max-width: 24em">
		<div class="row">
			<Input required value={value} oninput={(e) => (value = e.currentTarget.value)} />
			<Button type="submit" pending={save.isPending}>Save</Button>
		</div>
	</Field>
</form>

<style>
	.head {
		margin-bottom: 1em;
	}

	.row {
		display: flex;
		gap: 0.4em;
	}
</style>
