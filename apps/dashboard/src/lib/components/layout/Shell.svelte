<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { Drawer } from '@template/ui';
	import { user } from '$lib/utils/context';
	import Topbar from './Topbar.svelte';

	type Item = { href: string; label: string; exact?: boolean };
	type Crumb = { href?: string; label: string };

	let {
		back,
		sections,
		crumbs = [{ href: '/', label: 'Home' }],
		head,
		children
	}: {
		back?: { href: string; label: string };
		sections: { title?: string; items: Item[]; bottom?: boolean }[];
		crumbs?: Crumb[];
		head?: Snippet;
		children: Snippet;
	} = $props();

	const me = user();
	let open = $state(false);

	// Prefix matching keeps a parent lit on its children, but an index route like
	// /projects/[id] would then never turn off — hence `exact`.
	const at = (item: Item) =>
		(item.exact ? page.url.pathname === item.href : page.url.pathname.startsWith(item.href))
			? 'page'
			: undefined;
	const current = $derived(
		sections
			.flatMap((section) => section.items)
			.filter((item) => at(item))
			.sort((a, b) => b.href.length - a.href.length)[0]
	);
	const trail = $derived.by(() => {
		const items = crumbs.slice();
		if (current && items.at(-1)?.href !== current.href)
			items.push({ href: current.href, label: current.label });
		if (current && current.href !== page.url.pathname) items.push({ label: 'Details' });
		return items;
	});

	afterNavigate(() => (open = false));
</script>

{#snippet menu()}
	{#if back}
		<a class="back" href={resolve(back.href as Pathname)} data-transition="back"
			>&larr; {back.label}</a
		>
	{/if}
	<nav>
		{#each sections as section (section.title ?? section.items[0]?.href)}
			<div class="section" class:bottom={section.bottom}>
				{#if section.title}<span class="title">{section.title}</span>{/if}
				{#each section.items as item (item.href)}
					<a class="navlink" href={resolve(item.href as Pathname)} aria-current={at(item)}
						>{item.label}</a
					>
				{/each}
			</div>
		{/each}
	</nav>
{/snippet}

<Topbar user={me.current} {head} crumbs={trail} onmenu={() => (open = true)} />

<div class="body">
	<aside><div class="menu" data-shell-nav>{@render menu()}</div></aside>
	<main>{@render children()}</main>
</div>

<!-- Same menu, off canvas — the sidebar is too narrow to keep on a phone. -->
<Drawer bind:open side="left">
	<div class="sheet">{@render menu()}</div>
</Drawer>

<style>
	.body {
		display: flex;
		flex: 1;
	}

	.menu,
	.sheet {
		display: flex;
		flex-direction: column;
		gap: 1.25em;
	}

	.menu {
		flex: 1;
		view-transition-name: shell-nav;
	}

	aside {
		width: var(--rail);
		flex-shrink: 0;
		/* Pinned below the sticky topbar so the page scrolls under it; the fixed
		   height leaves room for bottom-anchored items via margin-top: auto. */
		position: sticky;
		top: var(--topbar);
		height: calc(100dvh - var(--topbar));
		overflow-y: auto;
		padding: 1.25em 0.75em;
		border-right: 1px solid var(--border);
		background: var(--surface);
	}

	/* Wide enough for the board's five columns and a month of cronograma; prose and
	   forms cap themselves far below this. */
	main {
		flex: 1;
		min-width: 0;
		max-width: 1440px;
		margin: 0 auto;
		padding: 1.75em 1.25em 3em;
		view-transition-name: shell-main;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
		/* Fills the rail so a `bottom` section's auto margin has room to push. */
		flex: 1;
	}

	.bottom {
		margin-top: auto;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.title {
		font-family: var(--font-mono);
		font-size: 0.68em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
		padding: 0 0.7em;
		margin-bottom: 0.35em;
	}

	.back,
	nav a {
		font-family: var(--font-mono);
		font-size: 0.82em;
	}

	.back {
		color: var(--muted);
		text-decoration: none;
		padding: 0 0.7em;
	}

	.back:hover {
		color: var(--ink);
	}

	@media (max-width: 700px) {
		aside {
			display: none;
		}
	}
</style>
