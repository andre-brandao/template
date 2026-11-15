<script lang="ts">
	import { Inline } from '@template/ui';
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';
	import { rename } from '../../api/apps.query';

	// An App's name and avatar, edited by an admin. `onchange` is the profile around it.
	let {
		id,
		name,
		image,
		onchange
	}: { id: string; name: string; image: string | null; onchange?: () => void } = $props();

	const save = rename({ onSuccess: () => onchange?.() });
</script>

<div class="edit">
	<AvatarUpload {name} {image} url="/avatars/user/{id}" size={56} {onchange} />
	<span class="name">
		<Inline
			label="App name"
			value={name}
			onsave={(next) => save.mutateAsync({ id, name: next })}
		/>
	</span>
</div>

<style>
	.edit {
		display: flex;
		align-items: center;
		gap: 0.9em;
	}

	.name {
		flex: 0 1 24em;
		min-width: 0;
		font-size: 1.05em;
		font-weight: 550;
	}
</style>
