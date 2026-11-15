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
		box-sizing: border-box;
		min-height: var(--control, 2.25em);
		font: inherit;
		text-align: left;
		padding: 0.4em 0.7em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
		color: var(--ink, #1c1b19);
		cursor: pointer;
	}

	button:hover {
		border-color: var(--border-bright, #d3d1cc);
	}

	button:focus-visible {
		border-color: var(--accent, #2f7f68);
		outline: none;
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
	}

	.caret {
		margin-inline-start: auto;
		color: var(--dim, #75736d);
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
