<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, ...rest }: { children: Snippet } & HTMLAttributes<HTMLElement> = $props();
</script>

<div class="tabs" {...rest}>{@render children()}</div>

<style>
	/* A segmented control: a recessed track, the chosen segment raised out of it. */
	.tabs {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		border-radius: var(--radius-sm, 6px);
		background: var(--surface-2, #f2f2f2);
		/* Squeezed below its labels, the row scrolls inside itself instead of breaking a tab. */
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}
</style>
