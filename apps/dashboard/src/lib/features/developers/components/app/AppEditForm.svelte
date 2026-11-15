<script lang="ts">
	import AvatarUpload from '$lib/components/AvatarUpload.svelte';

	// The App's avatar; its name is edited in the page header. `onchange` is the profile around it.
	let {
		id,
		name,
		image,
		onchange
	}: { id: string; name: string; image: string | null; onchange?: () => void } = $props();
</script>

<AvatarUpload {name} {image} url="/avatars/user/{id}" {onchange} />
