<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createHotkey, type RegisterableHotkey } from '@tanstack/svelte-hotkeys';
	import Kbd from '../kbd/Kbd.svelte';
	import { menu } from './ctx';

	let {
		onselect,
		danger = false,
		disabled = false,
		shortcut,
		children
	}: {
		onselect?: () => void;
		danger?: boolean;
		disabled?: boolean;
		/** Shown with Kbd and live while the menu is open; bind it page-wide yourself. */
		shortcut?: RegisterableHotkey;
		children: Snippet;
	} = $props();

	const ctx = menu();

	function select() {
		ctx.close();
		onselect?.();
	}

	// Rendered inside the popover, so this lands in the menu's exclusive scope.
	createHotkey(
		() => shortcut,
		select,
		() => ({ enabled: !disabled })
	);
</script>

<button
	type="button"
	role="menuitem"
	class={{ danger }}
	{disabled}
	tabindex="-1"
	onclick={select}
	onpointermove={(e) => !disabled && e.currentTarget.focus()}
>
	<span class="label">{@render children()}</span>
	{#if shortcut}<Kbd keys={shortcut} />{/if}
</button>

<style>
	button {
		display: flex;
		align-items: center;
		gap: 1.5em;
		width: 100%;
		min-height: 2em;
		padding: 0.3em 0.55em;
		border: none;
		border-radius: var(--radius-sm, 6px);
		background: none;
		color: var(--ink, #1c1b19);
		font: inherit;
		font-size: 0.88em;
		text-align: left;
		cursor: pointer;
		outline: none;
	}

	/* Pointer moves focus, so one highlight serves mouse and keyboard alike. */
	button:focus {
		background: var(--hover, rgb(0 0 0 / 0.06));
	}

	button:disabled {
		color: var(--dim, #8e8c86);
		cursor: default;
	}

	.danger {
		color: var(--danger, #b8452c);
	}

	.danger:focus {
		background: color-mix(in oklab, var(--danger, #b8452c) 10%, transparent);
	}

	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
