<script lang="ts">
	import TodoDetailPage from '$lib/features/todos/pages/TodoDetailPage.svelte';

	let { params } = $props();
</script>

<!-- Guarded for the same reason as /projects/[id] — see that route. -->
{#if params.id}
	<TodoDetailPage id={params.id} />
{/if}
