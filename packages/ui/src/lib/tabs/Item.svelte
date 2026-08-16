<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		active = false,
		href,
		children,
		...rest
	}: {
		active?: boolean;
		/** A link tab when set, a button otherwise. */
		href?: string;
		children: Snippet;
	} & HTMLAttributes<HTMLElement> = $props();
</script>

{#if href}
	<a class="tab" class:active {href} {...rest}>{@render children()}</a>
{:else}
	<button type="button" class="tab" class:active {...rest}>{@render children()}</button>
{/if}

<style>
	.tab {
		padding: 0.4em 0.9em;
		border: none;
		border-radius: 4px;
		background: none;
		color: var(--dim, #888);
		font-family: var(--font-mono, monospace);
		font-size: 0.78em;
		text-decoration: none;
		cursor: pointer;
	}

	.tab:hover {
		color: var(--muted, #666);
	}

	.active {
		background: var(--surface, #fff);
		color: var(--ink, #111);
	}
</style>
