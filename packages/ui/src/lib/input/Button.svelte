<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from '../spinner/Spinner.svelte';

	let {
		variant = 'primary',
		type = 'button',
		pending = false,
		disabled = false,
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		type?: 'button' | 'submit' | 'reset';
		pending?: boolean;
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<button {type} class={variant} disabled={pending || disabled} aria-busy={pending} {onclick}>
	{#if pending}
		<Spinner />
	{/if}
	{@render children()}
</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45em;
		min-height: 2.25em;
		border: 1px solid var(--border, #ddd);
		border-radius: var(--radius-sm, 6px);
		padding: 0.35em 0.85em;
		font: inherit;
		font-size: 0.93em;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		background: var(--surface, #fff);
		color: var(--ink, #111);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.05));
		transition:
			background 0.12s ease,
			border-color 0.12s ease,
			opacity 0.12s ease;
	}

	button:hover:not(:disabled) {
		background: var(--surface-2, #f2f2f2);
	}

	button:disabled {
		cursor: default;
		opacity: 0.55;
	}

	/* Ink on paper: the one solid control on a screen, so it is never mistaken. */
	button.primary {
		background: var(--primary, #111);
		border-color: var(--primary, #111);
		color: var(--primary-ink, #fff);
	}

	.primary:hover:not(:disabled) {
		background: color-mix(in oklab, var(--primary, #111) 86%, var(--surface, #fff));
		border-color: color-mix(in oklab, var(--primary, #111) 86%, var(--surface, #fff));
	}

	/* The default: an outlined paper button, the same box as an input. */
	.secondary:hover:not(:disabled) {
		border-color: var(--border-bright, #ccc);
	}

	button.danger {
		color: var(--danger, #a33b24);
	}

	.danger:hover:not(:disabled) {
		background: color-mix(in oklab, var(--danger, #a33b24) 8%, var(--surface, #fff));
		border-color: color-mix(in oklab, var(--danger, #a33b24) 40%, transparent);
	}

	button.ghost {
		background: transparent;
		border-color: transparent;
		box-shadow: none;
		color: var(--muted, #666);
		padding: 0 0.6em;
	}

	.ghost:hover:not(:disabled) {
		background: var(--hover, #eee);
		color: var(--ink, #111);
	}
</style>
