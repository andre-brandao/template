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
	<a class="tab" {href} aria-current={active ? 'page' : undefined} {...rest}>{@render children()}</a>
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
		min-height: calc(var(--control, 2.25em) - 4px);
		padding: 0 0.75em;
		white-space: nowrap;
		border: none;
		border-radius: 4px;
		background: none;
		color: var(--muted, #64625d);
		font: inherit;
		font-size: 0.93em;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
	}

	/* Inset, so the scrolling row doesn't clip the ring. */
	.tab:focus-visible {
		outline: 2px solid var(--accent, #2f7f68);
		outline-offset: -2px;
	}

	.tab:hover {
		color: var(--ink, #1c1b19);
	}

	[aria-current='page'],
	[aria-pressed='true'] {
		background: var(--surface, #fff);
		color: var(--ink, #1c1b19);
		box-shadow:
			0 0 0 1px var(--border, #e6e5e1),
			var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
	}
</style>
