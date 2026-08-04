<script lang="ts">
	import TodosPage from '$lib/features/todos/pages/TodosPage.svelte';

	let { params } = $props();
</script>

<TodosPage source="project" sourceID={params.id} />
