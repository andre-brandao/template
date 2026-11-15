<script lang="ts">
	import ProjectSettings from '$lib/features/projects/pages/ProjectSettings.svelte';

	let { params } = $props();
</script>

<!-- `params` is empty mid-navigation. -->
{#if params.id}
	<ProjectSettings id={params.id} />
{/if}
