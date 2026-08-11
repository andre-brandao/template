<script lang="ts">
	import InsightsPage from '$lib/features/todos/pages/InsightsPage.svelte';

	let { params } = $props();
</script>

<!-- Guarded for the same reason as /projects/[id] — see that route. -->
{#if params.id}
	<InsightsPage source="project" sourceID={params.id} />
{/if}
