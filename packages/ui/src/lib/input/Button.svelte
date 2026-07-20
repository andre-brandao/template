<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from '../ui/Spinner.svelte';

	let {
		variant = 'primary',
		type = 'button',
		pending = false,
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		type?: 'button' | 'submit' | 'reset';
		pending?: boolean;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<button {type} class={variant} disabled={pending} aria-busy={pending} {onclick}>
	{#if pending}
		<Spinner />
	{/if}
	{@render children()}
</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 6px);
		padding: 0.45em 1em;
		font: inherit;
		font-family: var(--font-mono, monospace);
		font-size: 0.85em;
		cursor: pointer;
		background: var(--surface, #fff);
		color: var(--ink, #111);
		transition:
			background 0.15s ease,
			border-color 0.15s ease,
			opacity 0.15s ease;
	}

	button:hover:not(:disabled) {
		border-color: var(--border-bright, #555);
	}

	button:disabled {
		cursor: default;
		opacity: 0.6;
	}

	button.primary {
		background: var(--accent, #4fa98f);
		border-color: var(--accent, #4fa98f);
		color: var(--accent-ink, #0d1110);
	}

	button.secondary {
		background: var(--surface-2, #eee);
		border-color: var(--surface-2, #eee);
		color: var(--ink, #111);
	}

	button.danger {
		background: transparent;
		border-color: var(--danger, #d3684f);
		color: var(--danger, #d3684f);
	}

	button.danger:hover:not(:disabled) {
		background: var(--danger, #d3684f);
		color: var(--accent-ink, #0d1110);
	}

	button.ghost {
		background: transparent;
		border-color: transparent;
		color: var(--muted, #666);
		padding: 0.35em 0.6em;
	}

	button.ghost:hover:not(:disabled) {
		color: var(--ink, #111);
	}

</style>
