<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		retry,
		children
	}: {
		/** A failed load passes its refetch, so the reader can do more than reload. */
		retry?: () => void;
		children: Snippet;
	} = $props();
</script>

<p class="issue">
	<span>{@render children()}</span>
	{#if retry}<button type="button" onclick={() => retry()}>Try again</button>{/if}
</p>

<style>
	.issue {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
		margin: 0 0 0.5em;
		padding: 0.5em 0.7em;
		border: 1px solid color-mix(in srgb, var(--danger, #b8452c) 45%, transparent);
		border-radius: var(--radius, 8px);
		background: color-mix(in srgb, var(--danger, #b8452c) 10%, transparent);
		color: var(--danger, #b8452c);
		font-size: 0.85em;
	}

	button {
		flex: none;
		padding: 0.2em 0.5em;
		border: 0;
		border-radius: var(--radius-sm, 6px);
		background: none;
		color: inherit;
		font: inherit;
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		cursor: pointer;
	}

	button:hover {
		background: color-mix(in srgb, var(--danger, #b8452c) 12%, transparent);
	}

	button:focus-visible {
		outline: 2px solid var(--accent, #2f7f68);
		outline-offset: 1px;
	}
</style>
