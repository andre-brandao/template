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
		height: var(--control, 2.25em);
		padding: 0 0.75em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		color: var(--muted, #64625d);
		font: inherit;
		font-size: 0.9em;
		white-space: nowrap;
		cursor: pointer;
	}

	.chip:hover:not(:disabled) {
		border-color: var(--border-bright, #d3d1cc);
		color: var(--ink, #1c1b19);
	}

	.chip:focus-visible {
		outline: none;
		border-color: var(--accent, #2f7f68);
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
	}

	.chip:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.chip[aria-pressed='true'] {
		border-color: color-mix(in oklab, var(--accent, #2f7f68) 45%, var(--border, #e6e5e1));
		background: color-mix(in oklab, var(--accent, #2f7f68) 12%, var(--surface, #fff));
		color: var(--ink, #1c1b19);
	}
</style>
