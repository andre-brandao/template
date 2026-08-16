<script lang="ts">
	import type { Snippet } from 'svelte';

	// The one region of a `Fill` that scrolls. Everything beside it keeps its own height.
	let { children }: { children: Snippet } = $props();
</script>

<div>{@render children()}</div>

<style>
	div {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		/* Reaching the end shouldn't hand the scroll to the document behind it. */
		overscroll-behavior: contain;
		/* Room for the scrollbar so rows don't shift under it. */
		scrollbar-gutter: stable;
	}
</style>
