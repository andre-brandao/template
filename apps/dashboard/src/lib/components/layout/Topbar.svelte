<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import type { User } from '@template/core/user';
	import Feedback from '$lib/features/feedback/components/Feedback.svelte';
	import Brand from './Brand.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Me from './Me.svelte';
	import Rail from './Rail.svelte';

	// `onmenu` is passed exactly where a sidebar exists to open, so it doubles as the
	// signal to render the rail — the left cell that lines up with that sidebar.
	let {
		user,
		onmenu,
		tight = false,
		peek = false,
		head,
		crumbs
	}: {
		user: User.Info | null;
		onmenu?: () => void;
		tight?: boolean;
		peek?: boolean;
		head?: Snippet<[boolean]>;
		crumbs?: { href?: string; label: string }[];
	} = $props();
</script>

<header>
	{#if onmenu}<Rail {onmenu} {tight} {peek} {head} />{/if}

	<div class="lead">
		{#if !onmenu}<Brand word={!head} />{@render head?.(false)}{/if}
	</div>

	{#if crumbs}<Breadcrumbs items={crumbs} />{/if}

	{#if dev}
		<span class="env" title="Not production — data here is throwaway">dev</span>
	{/if}

	<!-- The right cluster, Cloudflare-style: utilities first, then the account. -->
	<div class="tail">
		{#if user && page.data.feedback}<Feedback />{/if}
		<Me {user} />
	</div>
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

	.tail {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-left: auto;
	}

	@media (max-width: 700px) {
		/* Nothing leads once the rail itself is gone — `.lead` holds nothing, so it
		   must not reserve its padding either. */
		.lead {
			padding-inline: 0;
		}
	}
</style>
