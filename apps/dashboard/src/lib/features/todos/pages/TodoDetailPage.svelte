<script lang="ts">
	import { goto } from '$app/navigation';
	import TodoEditor from '../components/TodoEditor.svelte';

	let { id }: { id: string } = $props();
</script>

<TodoEditor {id} page onremove={() => goto('/todos')} />
