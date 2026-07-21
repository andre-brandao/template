<script lang="ts">
	import TodoDetailPage from '$lib/features/todos/pages/TodoDetailPage.svelte';

	let { params } = $props();
</script>

<TodoDetailPage id={params.id} />
