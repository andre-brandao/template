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
		border: 1px solid color-mix(in srgb, var(--danger, #c33) 45%, transparent);
		border-radius: var(--radius, 6px);
		background: color-mix(in srgb, var(--danger, #c33) 10%, transparent);
		color: var(--danger, #c33);
		font-size: 0.85em;
	}
</style>
