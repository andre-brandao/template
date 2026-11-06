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
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		min-height: 1.9em;
		padding: 0 0.75em;
		white-space: nowrap;
		border: none;
		border-radius: 4px;
		background: none;
		color: var(--muted, #666);
		font: inherit;
		font-size: 0.93em;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
	}

	/* Inset, so the scrolling row doesn't clip the ring. */
	.tab:focus-visible {
		outline-offset: -2px;
	}

	.tab:hover {
		color: var(--ink, #111);
	}

	.active {
		background: var(--surface, #fff);
		color: var(--ink, #111);
		box-shadow:
			0 0 0 1px var(--border, #e5e5e5),
			var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.05));
	}
</style>
