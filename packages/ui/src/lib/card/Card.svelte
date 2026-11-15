<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		accent,
		interactive = false,
		href,
		children
	}: {
		accent?: string;
		interactive?: boolean;
		href?: string;
		children: Snippet;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	{href}
	class={['card', { accent: !!accent, interactive }]}
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
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.1em;
	}

	.card.accent {
		padding-left: calc(1.1em - 2px);
		border-left: 3px solid var(--accent-rail);
	}

	.card.interactive {
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	.card.interactive:hover {
		border-color: var(--border-bright);
		box-shadow: var(--shadow-1);
	}

	.card.interactive.accent:hover {
		border-left-color: var(--accent-rail);
	}
</style>
