<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { Drawer } from '@template/ui';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import { user } from '$lib/utils/context';
	import Footer from './Footer.svelte';
	import Nav from './Nav.svelte';
	import { at, type Item } from './nav';
	import Topbar from './Topbar.svelte';

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

<Topbar user={me.current} {head} crumbs={trail} {tight} onmenu={() => (open = true)} />

<div class="body">
	<aside class:tight>
		<div class="menu" data-shell-nav><Nav {back} {sections} slim={tight} /></div>
		<!-- Below the line, like the content footer across the divider — the two strips
		     share --footer so their top borders draw one continuous rule. -->
		<div class="strip">
			<button
				class="toggle"
				type="button"
				aria-label={tight ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!tight}
				onclick={toggle}
			>
				<PanelLeft size={17} strokeWidth={1.75} />
			</button>
		</div>
	</aside>
	<!-- Footer inside the column so it starts where the rail ends; `main`'s flex
	     pushes it to the viewport bottom when the page is short. -->
	<div class="content">
		<main>{@render children()}</main>
		<Footer />
	</div>
</div>

<!-- Same menu, off canvas — the sidebar is too narrow to keep on a phone. -->
<Drawer bind:open side="left">
	<div class="sheet"><Nav {back} {sections} /></div>
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
		overflow-y: auto;
		overflow-x: hidden;
		padding: 1.25em 0.75em;
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
		border-right: 1px solid var(--border);
		background: var(--surface);
		transition: width 160ms ease;
	}

	.tight {
		width: var(--rail-tight);
	}

	.tight .menu {
		padding-inline: 0.5em;
	}

	.strip {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		height: var(--footer);
		padding-inline: 0.75em;
		border-top: 1px solid var(--border);
	}

	.tight .strip {
		justify-content: center;
		padding-inline: 0;
	}

	.toggle {
		display: inline-flex;
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

	.content {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
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
		/* In the column, `0 auto` margins would win over stretch and shrink-wrap the
		   page — the explicit width keeps it filling out to the cap. */
		width: 100%;
		max-width: 1440px;
		margin: 0 auto;
		padding: var(--pad-top) 1.25em var(--pad-bottom);
		view-transition-name: shell-main;
	}

	@media (max-width: 700px) {
		aside {
			display: none;
		}
	}
</style>
