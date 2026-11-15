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
		min-height: var(--control);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0 0.85em;
		font: inherit;
		font-size: 0.93em;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-1);
		transition:
			background 0.12s ease,
			border-color 0.12s ease,
			opacity 0.12s ease;
	}

	.button:hover:not(:disabled) {
		background: var(--surface-2);
	}

	.button:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: var(--ring);
	}

	.button:disabled {
		cursor: default;
		opacity: 0.55;
	}

	/* Ink on paper: the one solid control on a screen, so it is never mistaken. */
	.button.primary {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-ink);
	}

	.primary:hover:not(:disabled) {
		background: color-mix(in oklab, var(--primary) 86%, var(--surface));
		border-color: color-mix(in oklab, var(--primary) 86%, var(--surface));
	}

	/* The default: an outlined paper button, the same box as an input. */
	.secondary:hover:not(:disabled) {
		border-color: var(--border-bright);
	}

	.button.danger {
		color: var(--danger);
	}

	.danger:hover:not(:disabled) {
		background: color-mix(in oklab, var(--danger) 8%, var(--surface));
		border-color: color-mix(in oklab, var(--danger) 40%, transparent);
	}

	.button.ghost {
		background: transparent;
		border-color: transparent;
		box-shadow: none;
		color: var(--muted);
		padding: 0 0.6em;
	}

	.ghost:hover:not(:disabled) {
		background: var(--hover);
		color: var(--ink);
	}
</style>
