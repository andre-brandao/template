<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<p class="issue">{@render children()}</p>

<style>
	.issue {
		display: block;
		margin: 0 0 0.5em;
		padding: 0.5em 0.7em;
		border: 1px solid color-mix(in srgb, var(--danger, #b8452c) 45%, transparent);
		border-radius: var(--radius, 8px);
		background: color-mix(in srgb, var(--danger, #b8452c) 10%, transparent);
		color: var(--danger, #b8452c);
		font-size: 0.85em;
	}
</style>
