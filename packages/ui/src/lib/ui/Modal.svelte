<script lang="ts">
	import type { Snippet } from 'svelte';

	let { open = $bindable(false), children }: { open?: boolean; children: Snippet } = $props();

	export function toggle() {
		open = !open;
	}

	export function openModal() {
		open = true;
	}

	export function closeModal() {
		open = false;
	}

</script>

<dialog
	{@attach (dialog) => (open ? dialog.showModal() : dialog.close())}
	onclose={() => (open = false)}
	onclick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
>
	{#if open}
		{@render children()}
	{/if}
</dialog>

<style>
	dialog {
		margin: auto;
		width: min(30em, calc(100vw - 2em));
		max-width: none;
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		padding: 1.4em;
		background: var(--surface, #fff);
		color: var(--ink, #111);
		box-shadow: var(--shadow-2, 0 12px 28px -14px rgb(0 0 0 / 0.6));
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
		background: rgb(0 0 0 / 0.45);
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
