<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from '../spinner/Spinner.svelte';

	let {
		variant = 'secondary',
		type = 'button',
		pending = false,
		disabled = false,
		href,
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		type?: 'button' | 'submit' | 'reset';
		pending?: boolean;
		disabled?: boolean;
		/** Renders a link with the same look. */
		href?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

{#if href}
	<a {href} class={['button', variant]}>{@render children()}</a>
{:else}
	<button
		{type}
		class={['button', variant]}
		disabled={pending || disabled}
		aria-busy={pending}
		{onclick}
	>
		{#if pending}
			<Spinner />
		{/if}
		{@render children()}
	</button>
{/if}

<style>
	.button {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45em;
		box-sizing: border-box;
		min-height: var(--control, 2.25em);
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius-sm, 6px);
		padding: 0 0.85em;
		font: inherit;
		font-size: 0.93em;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		background: var(--surface, #fff);
		color: var(--ink, #1c1b19);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
		transition:
			background 0.12s ease,
			border-color 0.12s ease,
			opacity 0.12s ease;
	}

	.button:hover:not(:disabled) {
		background: var(--surface-2, #f2f1ee);
	}

	.button:focus-visible {
		outline: none;
		border-color: var(--accent, #2f7f68);
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
	}

	.button:disabled {
		cursor: default;
		opacity: 0.55;
	}

	/* Ink on paper: the one solid control on a screen, so it is never mistaken. */
	.button.primary {
		background: var(--primary, #1c1b19);
		border-color: var(--primary, #1c1b19);
		color: var(--primary-ink, #fff);
	}

	.primary:hover:not(:disabled) {
		background: color-mix(in oklab, var(--primary, #1c1b19) 86%, var(--surface, #fff));
		border-color: color-mix(in oklab, var(--primary, #1c1b19) 86%, var(--surface, #fff));
	}

	/* The default: an outlined paper button, the same box as an input. */
	.secondary:hover:not(:disabled) {
		border-color: var(--border-bright, #d3d1cc);
	}

	.button.danger {
		color: var(--danger, #b8452c);
	}

	.danger:hover:not(:disabled) {
		background: color-mix(in oklab, var(--danger, #b8452c) 8%, var(--surface, #fff));
		border-color: color-mix(in oklab, var(--danger, #b8452c) 40%, transparent);
	}

	.button.ghost {
		background: transparent;
		border-color: transparent;
		box-shadow: none;
		color: var(--muted, #64625d);
		padding: 0 0.6em;
	}

	.ghost:hover:not(:disabled) {
		background: var(--hover, rgb(0 0 0 / 0.06));
		color: var(--ink, #1c1b19);
	}
</style>
