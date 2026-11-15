<!-- The bordered list `Line` rows sit in. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<ul>
	{@render children()}
</ul>

<style>
	ul {
		max-width: 64em;
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--border, #ddd);
		border-radius: var(--radius, 6px);
		background: var(--surface, #fff);
		overflow: hidden;
	}
</style>
