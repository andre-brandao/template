<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLSelectAttributes & { children: Snippet } = $props();
</script>

<select {...rest}>{@render children()}</select>

<style>
	select {
		min-width: 0;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 6px);
		background: var(--surface, #fff);
		color: var(--ink, #111);
		font: inherit;
	}

	select:focus-visible {
		border-color: var(--accent, #4fa98f);
		outline: none;
	}
</style>
