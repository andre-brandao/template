<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import type { User } from '@template/core/user';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import Brand from './Brand.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Me from './Me.svelte';
	import Rail from './Rail.svelte';

	// `onmenu` is passed exactly where a sidebar exists to open, so it doubles as the
	// signal to render the rail — the left cell that lines up with that sidebar.
	let {
		user,
		onmenu,
		ontight,
		tight = false,
		head,
		crumbs
	}: {
		user: User.Info | null;
		onmenu?: () => void;
		ontight?: () => void;
		tight?: boolean;
		head?: Snippet<[boolean]>;
		crumbs?: { href?: string; label: string }[];
	} = $props();
</script>

<header>
	{#if onmenu}<Rail {onmenu} {tight} {head} />{/if}

	<!-- The toggle sits just past the divider, at the head of the content it widens. -->
	<div class="lead">
		{#if ontight}
			<button
				class="toggle"
				type="button"
				aria-label={tight ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!tight}
				onclick={ontight}
			>
				<PanelLeft size={17} strokeWidth={1.75} />
			</button>
		{/if}
		{#if !onmenu}<Brand word={!head} />{@render head?.(false)}{/if}
	</div>

	{#if crumbs}<Breadcrumbs items={crumbs} />{/if}

	{#if dev}
		<span class="env" title="Not production — data here is throwaway">dev</span>
	{/if}

	<Me {user} />
</header>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: stretch;
		gap: 1em;
		/* Fixed, so a taller control in the rail can't grow the bar. */
		height: var(--topbar);
		padding-right: 1.25em;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}

	/* Tight against the divider so the toggle reads as the leading edge of the
	   content pane rather than as another item in the bar. */
	.lead {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
		padding-inline: 0.6em 1.25em;
	}

	.toggle {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		padding: 0.4em;
		border: none;
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.toggle:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	/* Loud on purpose: the whole point is to catch the eye of someone who thinks
	   they are looking at production. Sits outside `.lead` so it trails the project
	   switcher instead of competing with it for the rail's width. */
	.env {
		flex-shrink: 0;
		align-self: center;
		padding: 0.15em 0.5em;
		font-family: var(--font-mono);
		font-size: 0.66em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border-radius: var(--radius);
		border: 1px solid color-mix(in oklab, var(--progress) 45%, transparent);
		background: color-mix(in oklab, var(--progress) 16%, var(--surface));
		color: var(--progress);
	}

	@media (max-width: 700px) {
		/* Nothing to collapse once the rail itself is gone — which leaves `.lead`
		   holding nothing, so it must not reserve its padding either. */
		.toggle {
			display: none;
		}

		.lead {
			padding-inline: 0;
		}
	}
</style>
