<script lang="ts">
	import type { Snippet } from 'svelte';
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import type { User } from '@template/core/user';
	import Feedback from '$lib/features/feedback/components/Feedback.svelte';
	import Brand from './Brand.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Me from './Me.svelte';

	// `onmenu` is passed exactly where a sidebar exists to open, so it doubles as the signal
	// that the brand lives over there — this bar carries it only once that sidebar is gone.
	let {
		user,
		onmenu,
		head,
		crumbs
	}: {
		user: User.Info | null;
		onmenu?: () => void;
		head?: Snippet<[boolean]>;
		crumbs?: { href?: string; label: string }[];
	} = $props();
</script>

<header>
	{#if onmenu}
		<button class="menu" type="button" aria-label="Open menu" onclick={onmenu}>
			<PanelLeft size={17} strokeWidth={1.75} />
		</button>
	{/if}

	<div class="lead" class:tucked={!!onmenu}>
		<Brand word={!head} />{@render head?.(false)}
	</div>

	{#if crumbs}<Breadcrumbs items={crumbs} />{/if}

	{#if dev}
		<a class="env" href={resolve('/dev')} title="Not production — data here is throwaway. Opens the dev tools.">dev</a>
	{/if}

	<!-- The right cluster, Cloudflare-style: utilities first, then the account. -->
	<div class="tail">
		{#if user && page.data.feedback}<Feedback />{/if}
		<Me {user} />
	</div>
</header>

<style>
	/* The content column's ceiling. It stops at the sidebar rather than crossing it, so the
	   divider beside it belongs to one element and cannot drift out of line. */
	header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: stretch;
		gap: 1em;
		/* Fixed, so a taller control in the bar can't grow it. */
		height: var(--topbar);
		padding-inline: 1.25em;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}

	.menu {
		display: none;
		flex-shrink: 0;
		align-self: center;
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

	.lead {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
	}

	/* The sidebar holds the mark and the switcher wherever there is one, so this bar shows
	   them only on the phone, where the sidebar is off canvas. */
	.tucked {
		display: none;
	}

	/* Loud on purpose: the whole point is to catch the eye of someone who thinks
	   they are looking at production. Doubles as the way into /dev. */
	.env {
		flex-shrink: 0;
		text-decoration: none;
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
		.menu,
		.tucked {
			display: flex;
		}
	}
</style>
