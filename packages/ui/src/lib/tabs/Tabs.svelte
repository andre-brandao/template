<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let { children, ...rest }: { children: Snippet } & HTMLAttributes<HTMLElement> = $props();
</script>

<div class="tabs" {...rest}>{@render children()}</div>

<style>
	.tabs {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		border: 1px solid var(--border, #333);
		border-radius: 6px;
		background: var(--surface-2, #eee);
	}
</style>
