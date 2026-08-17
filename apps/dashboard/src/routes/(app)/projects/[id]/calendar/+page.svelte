<script lang="ts">
	import CalendarPage from '$lib/features/todos/pages/CalendarPage.svelte';

	let { params } = $props();
</script>

<!-- Guarded for the same reason as /projects/[id] — see that route. -->
{#if params.id}
	<CalendarPage source="project" sourceID={params.id} />
{/if}
