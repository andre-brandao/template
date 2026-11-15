<script lang="ts">
	import { page } from '$app/state';
	import ProjectNav from '$lib/features/projects/components/ProjectNav.svelte';

	let { tight }: { tight: boolean } = $props();

	// Empty mid-navigation, and the switcher would fire its query with an undefined id.
	const id = $derived(page.params.id);
</script>

{#if id}
	<ProjectNav {id} {tight} />
{/if}
