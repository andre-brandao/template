<!--
	The topbar's left cell: same width and divider as the sidebar below it, so the two read
	as one column — the brand tops the rail the way it tops the menu. Rendered only where a
	sidebar exists to open, which is why `onmenu` is required rather than optional.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import Brand from './Brand.svelte';
	import { sidebar } from './rail.svelte';

	let { onmenu, head }: { onmenu: () => void; head?: Snippet<[boolean]> } = $props();

	// Straight from context rather than down through the Topbar: this cell is half the hover
	// target, so it has to peek the rail open itself, not just be told the width.
	const rail = sidebar();
	const tight = $derived(rail.shut);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- Hover here only widens the cell; nothing is operated by pointing at it, and everything
     inside that can be used is a control in its own right. -->
<div
	class="rail"
	class:tight
	class:peek={rail.peek}
	onpointerenter={rail.over}
	onpointerleave={rail.leave}
	onfocusin={() => rail.focus(true)}
	onfocusout={(e) => rail.focus(e.currentTarget.contains(e.relatedTarget as Node))}
>
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
		position: relative;
		transition:
			width 160ms ease,
			margin-right 160ms ease;
	}

	.tight {
		width: var(--rail-tight);
		justify-content: center;
		padding-inline: 0.5em;
	}

	/* The sidebar's peek widens over the page rather than pushing it, and the divider only
	   stays one line if this cell does the same — over the breadcrumbs, opaque, and carrying
	   the top of the same edge shadow. */
	.peek {
		margin-right: calc(var(--rail-tight) - var(--rail));
		background: var(--surface);
		box-shadow: 10px 0 24px -14px light-dark(rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.6));
		z-index: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.rail {
			transition: none;
		}
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
