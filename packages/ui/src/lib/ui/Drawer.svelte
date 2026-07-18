<script module lang="ts">
	export type Side = 'left' | 'right';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		side = 'right',
		children
	}: {
		open?: boolean;
		side?: Side;
		children: Snippet;
	} = $props();

</script>

<dialog
	class={side}
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
		position: fixed;
		inset-block: 0;
		inset-inline-start: auto;
		inset-inline-end: 0;
		margin: 0;
		width: min(28em, 100vw);
		height: 100dvh;
		max-width: none;
		max-height: none;
		border: none;
		border-inline-start: 1px solid var(--border, #333);
		padding: 1.25em;
		background: var(--surface, #fff);
		color: var(--ink, #111);
		box-shadow: -8px 0 24px rgb(0 0 0 / 0.15);
		overflow-y: auto;
		translate: 100% 0;
		transition:
			translate 0.25s ease,
			display 0.25s allow-discrete,
			overlay 0.25s allow-discrete;
	}

	dialog.left {
		inset-inline-end: auto;
		inset-inline-start: 0;
		border-inline-start: none;
		border-inline-end: 1px solid var(--border, #333);
		box-shadow: 8px 0 24px rgb(0 0 0 / 0.15);
		translate: -100% 0;
	}

	dialog[open] {
		translate: 0 0;
	}

	@starting-style {
		dialog[open] {
			translate: 100% 0;
		}

		dialog.left[open] {
			translate: -100% 0;
		}
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
		opacity: 1;
		transition:
			opacity 0.25s ease,
			display 0.25s allow-discrete,
			overlay 0.25s allow-discrete;
	}

	@starting-style {
		dialog[open]::backdrop {
			opacity: 0;
		}
	}
</style>
