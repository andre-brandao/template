<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { LucideIcon } from '@lucide/svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Drawer } from '@template/ui';
	import { user } from '$lib/utils/context';
	import Topbar from './Topbar.svelte';

	type Item = { href: string; label: string; icon?: LucideIcon; exact?: boolean };
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
		head?: Snippet<[boolean]>;
		children: Snippet;
	} = $props();

	const me = user();
	let open = $state(false);
	// Read after mount so the server and the first client render agree; the rail
	// only snaps shut for people who asked for it, and only once.
	let tight = $state(false);
	onMount(() => (tight = localStorage.getItem('rail') === 'tight'));
	const toggle = () => localStorage.setItem('rail', (tight = !tight) ? 'tight' : 'wide');

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

<!-- `slim` is the snippet's own flag rather than `tight` itself: the drawer renders the
     same menu at full width even while the desktop rail is collapsed. -->
{#snippet menu(slim: boolean)}
	{#if back}
		<a
			class="back"
			href={resolve(back.href as Pathname)}
			data-transition="back"
			title={slim ? back.label : undefined}
		>
			<ArrowLeft size={15} strokeWidth={1.75} />
			<span class="label">{back.label}</span>
		</a>
	{/if}
	<nav>
		{#each sections as section (section.title ?? section.items[0]?.href)}
			<div class="section" class:bottom={section.bottom}>
				{#if section.title}<span class="title">{section.title}</span>{/if}
				{#each section.items as item (item.href)}
					{@const Icon = item.icon}
					<a
						class="navlink"
						href={resolve(item.href as Pathname)}
						aria-current={at(item)}
						title={slim ? item.label : undefined}
					>
						{#if Icon}<Icon size={16} strokeWidth={1.75} />{/if}
						<span class="label">{item.label}</span>
					</a>
				{/each}
			</div>
		{/each}
	</nav>
{/snippet}

<Topbar
	user={me.current}
	{head}
	crumbs={trail}
	{tight}
	onmenu={() => (open = true)}
	ontight={toggle}
/>

<div class="body">
	<aside class:tight>
		<div class="menu" data-shell-nav>{@render menu(tight)}</div>
	</aside>
	<main>{@render children()}</main>
</div>

<!-- Same menu, off canvas — the sidebar is too narrow to keep on a phone. -->
<Drawer bind:open side="left">
	<div class="sheet">{@render menu(false)}</div>
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
		display: flex;
		flex-direction: column;
		width: var(--rail);
		flex-shrink: 0;
		/* Pinned below the sticky topbar so the page scrolls under it; the fixed
		   height leaves room for bottom-anchored items via margin-top: auto. */
		position: sticky;
		top: var(--topbar);
		height: calc(100dvh - var(--topbar));
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1.25em 0.75em;
		border-right: 1px solid var(--border);
		background: var(--surface);
		transition: width 160ms ease;
	}

	.tight {
		width: var(--rail-tight);
		padding-inline: 0.5em;
	}

	/* Icons stay put and the words fall away, so collapsing reads as the same rail
	   narrowing rather than a different menu. */
	.tight .label,
	.tight .title {
		display: none;
	}

	.tight .navlink,
	.tight .back {
		justify-content: center;
		padding-inline: 0;
	}

	/* Wide enough for the board's five columns and a month of cronograma; prose and
	   forms cap themselves far below this. */
	main {
		--pad-top: 1.75em;
		--pad-bottom: 3em;
		/* What's left of the viewport once the topbar and this padding are taken. A page
		   that scrolls a list internally sets `height: var(--fill)` on its root; keeping the
		   sum here means the arithmetic can't drift from the padding it depends on. */
		--fill: calc(100dvh - var(--topbar) - var(--pad-top) - var(--pad-bottom));
		flex: 1;
		min-width: 0;
		max-width: 1440px;
		margin: 0 auto;
		padding: var(--pad-top) 1.25em var(--pad-bottom);
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
		display: flex;
		align-items: center;
		gap: 0.6em;
		font-family: var(--font-mono);
		font-size: 0.82em;
	}

	/* The label carries the whole width of an expanded link, so it must not shrink
	   the icon when a name runs long. */
	.label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
