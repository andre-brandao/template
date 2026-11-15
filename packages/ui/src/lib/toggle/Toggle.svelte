<!-- An on/off filter chip for a toolbar, in place of a checkbox ("Only overdue"). `count` adds a
     tabular badge; `onclick` runs after `pressed` flips, so it can write a URL param. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		pressed = $bindable(false),
		count,
		disabled = false,
		onclick,
		children
	}: {
		pressed?: boolean;
		count?: number;
		disabled?: boolean;
		onclick?: (pressed: boolean) => void;
		children: Snippet;
	} = $props();

	function toggle() {
		pressed = !pressed;
		onclick?.(pressed);
	}
</script>

<button type="button" class="chip" aria-pressed={pressed} {disabled} onclick={toggle}>
	{@render children()}
	{#if count !== undefined}<span class="n">{count}</span>{/if}
</button>

<style>
	.chip {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 0.4em;
		height: var(--control, 2rem);
		padding: 0 0.75em;
		border: 1px solid var(--border, #ddd);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		color: var(--muted, #666);
		font: inherit;
		font-size: 0.9em;
		white-space: nowrap;
		cursor: pointer;
	}

	.chip:hover:not(:disabled) {
		border-color: var(--border-bright, #ccc);
		color: var(--ink, #111);
	}

	.chip:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.chip[aria-pressed='true'] {
		border-color: color-mix(in oklab, var(--accent, #2f7f68) 45%, var(--border, #ddd));
		background: color-mix(in oklab, var(--accent, #2f7f68) 12%, var(--surface, #fff));
		color: var(--ink, #111);
	}

	.n {
		padding: 0 0.4em;
		border-radius: 999px;
		background: var(--surface-2, #f2f2f2);
		font-size: 0.95em;
		font-variant-numeric: tabular-nums;
	}
</style>
