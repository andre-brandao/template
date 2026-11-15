<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dialog } from './dialog';

	// Named after the first heading in its body, which every modal body renders.
	let { open = $bindable(false), children }: { open?: boolean; children: Snippet } = $props();
</script>

<dialog {@attach dialog(open)} onclose={() => (open = false)}>
	{#if open}
		{@render children()}
	{/if}
</dialog>

<style>
	dialog {
		margin: auto;
		width: min(30em, calc(100vw - 2em));
		max-width: none;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 4px);
		padding: 1.5em;
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-2);
		opacity: 0;
		scale: 0.97;
		transition:
			opacity 0.2s ease,
			scale 0.2s ease,
			display 0.2s allow-discrete,
			overlay 0.2s allow-discrete;
	}

	dialog[open] {
		opacity: 1;
		scale: 1;
	}

	@starting-style {
		dialog[open] {
			opacity: 0;
			scale: 0.97;
		}
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.32);
		opacity: 1;
		transition:
			opacity 0.2s ease,
			display 0.2s allow-discrete,
			overlay 0.2s allow-discrete;
	}

	@starting-style {
		dialog[open]::backdrop {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		dialog {
			scale: 1;
		}
	}
</style>
