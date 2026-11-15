<script module lang="ts">
	export type Side = 'left' | 'right' | 'bottom';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconButton from '../input/IconButton.svelte';
	import { dialog } from '../modal/dialog';

	let {
		open = $bindable(false),
		side = 'right',
		label,
		onclose,
		children
	}: {
		open?: boolean;
		side?: Side;
		/** Names the dialog; without it, the first heading in the body does. */
		label?: string;
		onclose?: () => void;
		children: Snippet;
	} = $props();
</script>

<dialog
	class={side}
	aria-label={label}
	{@attach dialog(open)}
	onclose={() => {
		// Fires on every close — user-initiated or parent-driven — so handlers must
		// be idempotent (e.g. shallow routing checks its state before history.back()).
		open = false;
		onclose?.();
	}}
>
	<div class="chrome">
		<IconButton label="Close" size="sm" onclick={(e) => e.currentTarget.closest('dialog')?.close()}>
			✕
		</IconButton>
	</div>
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
		border-inline-start: 1px solid var(--border, #e6e5e1);
		padding: 1.25em;
		background: var(--surface, #fff);
		color: var(--ink, #1c1b19);
		box-shadow: -8px 0 24px rgb(0 0 0 / 0.15);
		overflow-x: hidden;
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
		border-inline-end: 1px solid var(--border, #e6e5e1);
		box-shadow: 8px 0 24px rgb(0 0 0 / 0.15);
		translate: -100% 0;
	}

	/* A sheet: full width, capped height, and it never fills more of the screen than it needs. */
	dialog.bottom {
		inset-block-start: auto;
		inset-block-end: 0;
		inset-inline: 0;
		width: 100vw;
		height: auto;
		max-height: 85dvh;
		border-inline-start: none;
		border-block-start: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius, 8px) var(--radius, 8px) 0 0;
		padding-bottom: max(1.25em, env(safe-area-inset-bottom));
		box-shadow: 0 -8px 24px rgb(0 0 0 / 0.15);
		translate: 0 100%;
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

		dialog.bottom[open] {
			translate: 0 100%;
		}
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.32);
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

	.chrome {
		display: flex;
		justify-content: flex-end;
		margin: -0.5em -0.5em 0.5em auto;
	}

	@media (prefers-reduced-motion: reduce) {
		dialog,
		dialog::backdrop {
			transition: none;
		}
	}
</style>
