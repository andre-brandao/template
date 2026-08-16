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
	import { at, type Nav as Config } from './nav';
	import { origin } from './back.svelte';
	import { sidebar } from './rail.svelte';
	import Topbar from './Topbar.svelte';

	let { nav, children }: { nav: Config; children: Snippet } = $props();

	const me = user();
	const rail = sidebar();
	let open = $state(false);

	// One tracker for the whole app: the section moves under it as `nav` changes.
	const from = origin(
		() => nav.root,
		() => nav.fallback
	);
	const back = $derived(
		nav.back ? { label: nav.back.label, href: nav.back.href ?? from.href } : undefined
	);

	const items = $derived([...nav.sections.top, ...(nav.sections.bottom ?? [])]);
	const current = $derived(
		items
			.flatMap((section) => section.items)
			.filter((item) => at(item))
			.sort((a, b) => b.href.length - a.href.length)[0]
	);
	const trail = $derived.by(() => {
		const crumbs = (nav.crumbs ?? [{ href: '/', label: 'Home' }]).slice();
		if (current && crumbs.at(-1)?.href !== current.href)
			crumbs.push({ href: current.href, label: current.label });
		if (current && current.href !== page.url.pathname) crumbs.push({ label: 'Details' });
		return crumbs;
	});

	afterNavigate(() => (open = false));
</script>


{#snippet crest(tight: boolean)}
	{#if nav.head}<nav.head {tight} />{/if}
{/snippet}

<div class="body">
	<!-- Collapsed, pointing at the rail peeks it open again and it shuts on the way out. Focus
	     does the same, so tabbing into an icon-only rail still reads. -->
	<aside class:tight={rail.shut} class:peek={rail.peek} {...rail.attrs}>
		<!-- Passed only where the section has one: Rail and Topbar both read its absence to
		     decide whether the brand carries the wordmark. -->
		<Rail head={nav.head && crest} slim={rail.shut} />
		<div class="menu"><Nav {back} sections={nav.sections} slim={rail.shut} /></div>
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
		<Topbar user={me.current} head={nav.head && crest} crumbs={trail} onmenu={() => (open = true)} />
		<main>{@render children()}</main>
		<Footer />
	</div>
</div>

<!-- Same menu, off canvas — the sidebar is too narrow to keep on a phone. -->
<Drawer bind:open side="left">
	<div class="sheet"><Nav {back} sections={nav.sections} /></div>
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

	/* The page slides; the rail and its menu are painted over it and hold still. Groups are
	   painted in document order by default, which puts `shell-main` on top of the column it
	   slides across — these z-indexes stack the column back above it. */
	:global(::view-transition-group(shell-rail)) {
		z-index: 2;
	}

	:global(::view-transition-group(shell-nav)) {
		z-index: 3;
	}

	/* The sidebar's active pill rides above the menu it sits in, which is above the page. */
	:global(::view-transition-group(active)) {
		z-index: 4;
	}

	:global(::view-transition-old(shell-rail)),
	:global(::view-transition-new(shell-rail)) {
		animation: none;
		mix-blend-mode: normal;
	}

	/* A plain cross-fade: identical menus fade to nothing visible, so only a change of
	   section reads. Nothing to suppress now that the shell itself never remounts. */
	:global(::view-transition-old(shell-nav)),
	:global(::view-transition-new(shell-nav)) {
		animation-duration: 160ms;
		mix-blend-mode: normal;
	}

	:global(::view-transition-old(shell-main)),
	:global(::view-transition-new(shell-main)) {
		--shift: 28px;
		animation-duration: 220ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		animation-fill-mode: both;
		mix-blend-mode: normal;
	}

	:global(html[data-transition='forward']::view-transition-old(shell-main)) {
		animation-name: oldleft;
	}

	:global(html[data-transition='forward']::view-transition-new(shell-main)) {
		animation-name: newright;
	}

	:global(html[data-transition='back']::view-transition-old(shell-main)) {
		animation-name: oldright;
	}

	:global(html[data-transition='back']::view-transition-new(shell-main)) {
		animation-name: newleft;
	}

	/* Something inside the page owns this one — hold the column still and let it animate. */
	:global(html[data-scope]::view-transition-old(shell-main)) {
		opacity: 0;
		animation: none;
	}

	:global(html[data-scope]::view-transition-new(shell-main)) {
		animation: none;
	}

	@keyframes oldleft {
		to {
			opacity: 0;
			transform: translateX(calc(-1 * var(--shift)));
		}
	}

	@keyframes newright {
		from {
			opacity: 0;
			transform: translateX(var(--shift));
		}
	}

	@keyframes oldright {
		to {
			opacity: 0;
			transform: translateX(var(--shift));
		}
	}

	@keyframes newleft {
		from {
			opacity: 0;
			transform: translateX(calc(-1 * var(--shift)));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(shell-main)),
		:global(::view-transition-new(shell-main)),
		:global(::view-transition-old(shell-nav)),
		:global(::view-transition-new(shell-nav)) {
			animation: none;
		}
	}
</style>
