<script lang="ts">
	import { goto } from '$app/navigation';
	import TodoEditor from '../components/TodoEditor.svelte';

	let { id }: { id: string } = $props();
</script>

<div class="page">
	<a class="back" href="/todos">&larr; Back to todos</a>
	<TodoEditor {id} onremove={() => goto('/todos')} />
</div>

<style>
	.page {
		max-width: 68rem;
	}

	.back {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		text-decoration: none;
		margin-bottom: 1em;
	}

	.back:hover {
		color: var(--ink);
	}
</style>
