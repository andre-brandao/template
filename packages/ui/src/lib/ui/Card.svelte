<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="card">
	{@render children()}
</div>

<style>
	.card {
		background: var(--surface, #fff);
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		padding: 1.1em;
	}
</style>
