<script lang="ts">
	import type { Snippet } from 'svelte';

	// Standard page header: a title row with optional actions, then children as the lead.
	let { title, actions, children }: { title: string; actions?: Snippet; children?: Snippet } =
		$props();
</script>

<header>
	<div class="head">
		<h1>{title}</h1>
		{#if actions}{@render actions()}{/if}
	</div>

	{#if children}
		<p class="lead">{@render children()}</p>
	{/if}
</header>

<style>
	header {
		view-transition-name: shell-header;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
		margin-bottom: 0.75em;
	}

	/* Tighter when a lead follows — the lead's own bottom margin carries the gap. */
	.head:has(+ .lead:not(:empty)) {
		margin-bottom: 0.4em;
	}

	h1 {
		margin: 0;
		font-size: 1.4em;
	}

	.lead {
		margin: 0 0 1.25em;
		color: var(--muted);
		max-width: 60ch;
	}

	/* A lead snippet may render nothing (e.g. a null description) — drop the box
	   so it doesn't leave a stray gap. */
	.lead:empty {
		display: none;
	}

	.lead :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
</style>
