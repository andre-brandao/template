<script lang="ts">
	import InsightsPage from '$lib/features/todos/pages/InsightsPage.svelte';

	let { params } = $props();
</script>

<InsightsPage source="project" sourceID={params.id} />
