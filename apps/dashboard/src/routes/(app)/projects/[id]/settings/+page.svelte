<script lang="ts">
	import ProjectSettings from '$lib/features/projects/pages/ProjectSettings.svelte';

	let { params } = $props();
</script>

<!-- Guarded for the same reason as /projects/[id] — see that route. -->
{#if params.id}
	<ProjectSettings id={params.id} />
{/if}
