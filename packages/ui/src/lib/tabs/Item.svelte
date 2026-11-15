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

<!-- A segmented control, not a tablist: a link tab is the current page, a button a toggle. -->
{#if href}
	<a class="tab" {href} aria-current={active ? 'page' : undefined} {...rest}>{@render children()}</a
	>
{:else}
	<button type="button" class="tab" aria-pressed={active} {...rest}>{@render children()}</button>
{/if}

<style>
	.tab {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		box-sizing: border-box;
		/* The track's 2px padding on each side, so the whole control is one control tall. */
		min-height: calc(var(--control) - 4px);
		padding: 0 0.75em;
		white-space: nowrap;
		border: none;
		border-radius: 4px;
		background: none;
		color: var(--muted);
		font: inherit;
		font-size: 0.93em;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
	}

	/* Inset, so the scrolling row doesn't clip the ring. */
	.tab:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.tab:hover {
		color: var(--ink);
	}

	[aria-current='page'],
	[aria-pressed='true'] {
		background: var(--surface);
		color: var(--ink);
		box-shadow:
			0 0 0 1px var(--border),
			var(--shadow-1);
	}
</style>
