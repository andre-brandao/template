<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createHotkey, type RegisterableHotkey } from '@tanstack/svelte-hotkeys';
	import Kbd from '../kbd/Kbd.svelte';
	import { menu } from './ctx';

	let {
		onselect,
		href,
		danger = false,
		disabled = false,
		shortcut,
		children
	}: {
		onselect?: () => void;
		/** A link item: middle-click, new tab and the status-bar URL all work. */
		href?: string;
		danger?: boolean;
		disabled?: boolean;
		/** Shown with Kbd and live while the menu is open; bind it page-wide yourself. */
		shortcut?: RegisterableHotkey;
		children: Snippet;
	} = $props();

	const ctx = menu();
	let el: HTMLElement | undefined = $state();

	function select() {
		ctx.close();
		onselect?.();
	}

	// Rendered inside the popover, so this lands in the menu's exclusive scope. A click, so
	// a link item still goes through the router.
	createHotkey(
		() => shortcut,
		() => el?.click(),
		() => ({ enabled: !disabled })
	);
</script>

{#snippet body()}
	<span class="label">{@render children()}</span>
	{#if shortcut}<Kbd keys={shortcut} />{/if}
{/snippet}

{#if href && !disabled}
	<a
		bind:this={el}
		{href}
		role="menuitem"
		class={['item', { danger }]}
		tabindex="-1"
		onclick={select}
		onpointermove={(e) => e.currentTarget.focus()}
	>
		{@render body()}
	</a>
{:else}
	<button
		bind:this={el}
		type="button"
		role="menuitem"
		class={['item', { danger }]}
		{disabled}
		tabindex="-1"
		onclick={select}
		onpointermove={(e) => !disabled && e.currentTarget.focus()}
	>
		{@render body()}
	</button>
{/if}

<style>
	.item {
		display: flex;
		align-items: center;
		gap: 1.5em;
		box-sizing: border-box;
		width: 100%;
		min-height: 2em;
		padding: 0.3em 0.55em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 0.88em;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		outline: none;
	}

	/* Pointer moves focus, so one highlight serves mouse and keyboard alike. */
	.item:focus {
		background: var(--hover);
	}

	.item:disabled {
		color: var(--dim);
		cursor: default;
	}

	.danger {
		color: var(--danger);
	}

	.danger:focus {
		background: color-mix(in oklab, var(--danger) 10%, transparent);
	}

	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
