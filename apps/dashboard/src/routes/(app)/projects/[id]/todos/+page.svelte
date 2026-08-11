<script lang="ts">
	import TodosPage from '$lib/features/todos/pages/TodosPage.svelte';

	let { params } = $props();
</script>

<!-- Guarded for the same reason as /projects/[id] — see that route. -->
{#if params.id}
	<TodosPage source="project" sourceID={params.id} />
{/if}
