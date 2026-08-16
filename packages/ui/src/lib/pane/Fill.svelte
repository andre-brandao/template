<script lang="ts">
	import type { Snippet } from 'svelte';

	// A screen that scrolls a list internally rather than scrolling the document: the header
	// and whatever sits under the list hold still. `--fill` is published by the app's shell —
	// what the viewport has left once its chrome and padding are taken.
	let { children }: { children: Snippet } = $props();
</script>

<div>{@render children()}</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		height: var(--fill, 100dvh);
		/* Below this the list is too short to be worth its own scroller; let the page scroll
		   instead of squeezing it to two rows. */
		min-height: 22em;
	}
</style>
