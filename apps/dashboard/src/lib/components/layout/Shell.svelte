<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { Drawer } from '@template/ui';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import { user } from '$lib/utils/context';
	import Footer from './Footer.svelte';
	import Nav from './Nav.svelte';
	import Rail from './Rail.svelte';
	import { at, type Item } from './nav';
	import { sidebar } from './rail.svelte';
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
	const rail = sidebar();
	let open = $state(false);

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

<div class="body">
	<!-- Collapsed, pointing at the rail peeks it open again and it shuts on the way out. Focus
	     does the same, so tabbing into an icon-only rail still reads. -->
	<aside class:tight={rail.shut} class:peek={rail.peek} {...rail.attrs}>
		<Rail {head} slim={rail.shut} />
		<div class="menu" data-shell-nav><Nav {back} {sections} slim={rail.shut} /></div>
		<!-- Below the line, like the content footer across the divider — the two strips
		     share --footer so their top borders draw one continuous rule. -->
		<div class="strip">
			<button
				class="toggle"
				type="button"
				aria-label={rail.tight ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!rail.tight}
				onclick={rail.toggle}
			>
				<PanelLeft size={17} strokeWidth={1.75} />
			</button>
		</div>
	</aside>
	<!-- Header and footer both inside the column so they start where the sidebar ends;
	     `main`'s flex pushes the footer to the viewport bottom when the page is short. -->
	<div class="content">
		<Topbar user={me.current} {head} crumbs={trail} onmenu={() => (open = true)} />
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

	/* Full height from the very top, so the one divider between the two columns is drawn by
	   one element top to bottom — nothing above it to keep in line. */
	aside {
		display: flex;
		flex-direction: column;
		width: var(--rail);
		flex-shrink: 0;
		position: sticky;
		top: 0;
		height: 100dvh;
		border-right: 1px solid var(--border);
		background: var(--surface);
		/* Over the content header's 20, so a peek covers the bar as well as the page. */
		z-index: 30;
		transition: var(--slide);
		/* Named so it becomes its own view-transition group. Without it the column lives in
		   the root snapshot, which the page's group is painted over — and `shell-main` slides
		   28px sideways, so every navigation dragged the page across the sidebar. */
		view-transition-name: shell-rail;
	}

	.tight {
		width: var(--rail-tight);
	}

	.peek {
		margin-right: var(--peek);
		/* --shadow-2 falls downwards, which a full-height edge never shows. Same weight,
		   turned to the side the panel actually hangs over. */
		box-shadow: 10px 0 24px -14px light-dark(rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.6));
	}

	@media (prefers-reduced-motion: reduce) {
		aside {
			transition: none;
		}
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
