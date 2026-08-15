<script lang="ts">
	import type { Snippet } from 'svelte';
	import { combobox } from './ctx.svelte';

	let { caret = true, children }: { caret?: boolean; children: Snippet } = $props();

	const ctx = combobox();
</script>

<button
	type="button"
	role="combobox"
	aria-haspopup="listbox"
	aria-expanded={ctx.open}
	aria-controls={ctx.id}
	onclick={() => ctx.set(!ctx.open)}
>
	{@render children()}
	{#if caret}<span class="caret" aria-hidden="true">▾</span>{/if}
</button>

<style>
	button {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		min-width: 0;
		font: inherit;
		font-family: var(--font-mono, monospace);
		font-size: 0.8em;
		text-align: left;
		padding: 0.5em 0.6em;
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		background: var(--surface-2, #eee);
		color: var(--ink, #111);
		cursor: pointer;
	}

	button:hover {
		border-color: var(--border-bright, #555);
	}

	button:focus-visible {
		border-color: var(--accent, #4fa98f);
		outline: none;
	}

	.caret {
		margin-inline-start: auto;
		color: var(--dim, #888);
		font-size: 0.85em;
		transition: rotate 0.15s ease;
	}

	button[aria-expanded='true'] .caret {
		rotate: 180deg;
	}

	@media (prefers-reduced-motion: reduce) {
		.caret {
			transition: none;
		}
	}
</style>
