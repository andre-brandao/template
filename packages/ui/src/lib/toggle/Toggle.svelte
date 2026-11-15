<!-- An on/off filter chip for a toolbar, in place of a checkbox ("Only overdue"). `onclick`
     runs after `pressed` flips, so it can write a URL param. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		pressed = $bindable(false),
		disabled = false,
		onclick,
		children
	}: {
		pressed?: boolean;
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
</button>

<style>
	.chip {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 0.4em;
		box-sizing: border-box;
		height: var(--control);
		padding: 0 0.75em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--muted);
		font: inherit;
		font-size: 0.9em;
		white-space: nowrap;
		cursor: pointer;
	}

	.chip:hover:not(:disabled) {
		border-color: var(--border-bright);
		color: var(--ink);
	}

	.chip:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: var(--ring);
	}

	.chip:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.chip[aria-pressed='true'] {
		border-color: color-mix(in oklab, var(--accent) 45%, var(--border));
		background: color-mix(in oklab, var(--accent) 12%, var(--surface));
		color: var(--ink);
	}
</style>
