<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		accent,
		interactive = false,
		dense = false,
		href,
		as = 'div',
		children
	}: {
		accent?: string;
		interactive?: boolean;
		/** Row density — list rows sit tighter than a standalone card. */
		dense?: boolean;
		href?: string;
		/** The element to render when it isn't a link, so a list row can stay an `li`. */
		as?: 'div' | 'li';
		children: Snippet;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : as}
	{href}
	class={['card', { accent: !!accent, interactive, dense }]}
	style:--accent-rail={accent}
>
	{@render children()}
</svelte:element>

<style>
	/* As a link the card is the whole click target; the chrome carries the affordance,
	   so the anchor drops its own. */
	a.card {
		display: block;
		color: inherit;
		text-decoration: none;
	}

	.card {
		position: relative;
		background: var(--surface, #fff);
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		box-shadow: var(--shadow-1);
		padding: 1.1em;
	}

	.card.accent {
		padding-left: calc(1.1em - 2px);
		border-left: 3px solid var(--accent-rail);
	}

	.card.dense {
		padding: 0.8em 1em;
	}

	.card.dense.accent {
		padding-left: calc(1em - 2px);
	}

	.card.interactive {
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	.card.interactive:hover {
		border-color: var(--border-bright, #555);
		box-shadow: var(--shadow-2);
		transform: translateY(-1px);
	}

	.card.interactive.accent:hover {
		border-left-color: var(--accent-rail);
	}
</style>
