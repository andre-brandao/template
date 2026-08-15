<script lang="ts">
	import type { Snippet } from 'svelte';
	import { combobox } from './ctx.svelte';

	let {
		value,
		label,
		href,
		children
	}: {
		value: string;
		/** What the query matches against. Falls back to the value. */
		label?: string;
		/** Renders a link instead of a button — picking it navigates. */
		href?: string;
		children: Snippet;
	} = $props();

	const ctx = combobox();
	const show = $derived(ctx.match(label ?? value));

	// The count lives on the root so `Empty` can ask one question instead of every
	// item reporting to it.
	$effect(() => {
		if (!show) return;
		ctx.tally(1);
		return () => ctx.tally(-1);
	});
</script>

{#if show}
	<svelte:element
		this={href ? 'a' : 'button'}
		{href}
		type={href ? undefined : 'button'}
		role="option"
		tabindex={0}
		aria-selected={ctx.value === value}
		onclick={() => (href ? ctx.set(false) : ctx.pick(value))}
	>
		{@render children()}
	</svelte:element>
{/if}

<style>
	:where(a, button) {
		display: flex;
		align-items: center;
		gap: 0.45em;
		width: 100%;
		font: inherit;
		font-family: var(--font-mono, monospace);
		font-size: 0.8em;
		text-align: left;
		padding: 0.5em 0.55em;
		border: none;
		border-radius: var(--radius, 6px);
		background: none;
		color: var(--muted, #666);
		text-decoration: none;
		cursor: pointer;
	}

	:where(a, button):hover,
	:where(a, button):focus-visible {
		color: var(--ink, #111);
		background: var(--surface-2, #eee);
		outline: none;
	}

	/* The accent rail Card uses for the same job — inset so nothing shifts. */
	:where(a, button)[aria-selected='true'] {
		color: var(--ink, #111);
		box-shadow: inset 2px 0 0 var(--accent, #4fa98f);
	}
</style>
