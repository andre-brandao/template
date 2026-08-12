<!--
	The topbar's left cell: same width and divider as the sidebar below it, so the two read
	as one column — the brand tops the rail the way it tops the menu. Rendered only where a
	sidebar exists to open, which is why `onmenu` is required rather than optional.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import Brand from './Brand.svelte';

	let {
		onmenu,
		tight = false,
		head
	}: { onmenu: () => void; tight?: boolean; head?: Snippet<[boolean]> } = $props();
</script>

<div class="rail" class:tight>
	<button class="menu" type="button" aria-label="Open menu" onclick={onmenu}>
		<PanelLeft size={17} strokeWidth={1.75} />
	</button>
	<!-- Collapsed the corner has room for one mark. The project's says more than the app's,
	     and the sidebar's home link covers what the brand was for. -->
	{#if !(tight && head)}<Brand word={!head && !tight} />{/if}
	{@render head?.(tight)}
</div>

<style>
	.rail {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
		width: var(--rail);
		flex-shrink: 0;
		padding-inline: 0.75em;
		border-right: 1px solid var(--border);
		transition: width 160ms ease;
	}

	.tight {
		width: var(--rail-tight);
		justify-content: center;
		padding-inline: 0.5em;
	}

	.menu {
		display: none;
		flex-shrink: 0;
		align-items: center;
		padding: 0.4em;
		border: none;
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.menu:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	@media (max-width: 700px) {
		/* The sidebar is off canvas here, so there is no column left to align to. */
		.rail {
			width: auto;
			flex-shrink: 1;
			border-right: none;
			padding-right: 0;
		}

		.menu {
			display: inline-flex;
		}
	}
</style>
