<!--
	The navigation half of the transition system: it sets the attributes, and the components
	that own the moving elements declare what those attributes mean. Nothing is styled here.

	  data-transition  forward | back   direction, for whatever slides
	  data-scope       filter | pane    something smaller than the page is animating
	  data-swap        the query keys a same-path navigation changed
-->
<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import type { OnNavigate } from '@sveltejs/kit';

	const depth = (url?: URL) => url?.pathname.split('/').filter(Boolean).length ?? 0;

	const link = (nav: OnNavigate) =>
		nav.type === 'link' && nav.event.target instanceof Element
			? nav.event.target.closest('a')
			: null;

	const back = (nav: OnNavigate) => {
		if (nav.type === 'popstate') return nav.delta < 0;
		return link(nav)?.dataset.transition === 'back' || depth(nav.to?.url) < depth(nav.from?.url);
	};

	// Which query keys a same-path navigation changed. A component claims the key it owns, so
	// switching a tab animates that tab's panel and typing in a search box animates nothing.
	const keys = (nav: OnNavigate) => {
		const from = nav.from?.url.searchParams;
		const to = nav.to?.url.searchParams;
		if (!from || !to) return '';
		return [...new Set([...from.keys(), ...to.keys()])]
			.filter((key) => String(from.getAll(key)) !== String(to.getAll(key)))
			.join(' ');
	};

	// Progressive enhancement: browsers without the API (or users who opted out
	// of motion) just get the instant swap.
	onNavigate((nav) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const root = document.documentElement;
		// Same path, different query: a filter changed, not the page.
		const local = nav.to?.url.pathname === nav.from?.url.pathname;
		const scope = local ? 'filter' : link(nav)?.dataset.transition === 'pane' ? 'pane' : '';

		root.dataset.transition = back(nav) ? 'back' : 'forward';
		// Before the snapshot, so the outgoing frame is captured with the names already applied.
		if (scope) root.dataset.scope = scope;
		if (local) root.dataset.swap = keys(nav);

		return new Promise((resolve) => {
			const view = document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});
			view.finished.finally(() => {
				delete root.dataset.transition;
				delete root.dataset.scope;
				delete root.dataset.swap;
			});
		});
	});
</script>
