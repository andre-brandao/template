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
		min-height: 2.25em;
		font: inherit;
		text-align: left;
		padding: 0.4em 0.7em;
		border: 1px solid var(--border, #ddd);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.05));
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
