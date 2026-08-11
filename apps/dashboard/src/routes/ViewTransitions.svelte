<script lang="ts">
	import { onNavigate } from '$app/navigation';

	const depth = (url?: URL) => url?.pathname.split('/').filter(Boolean).length ?? 0;

	// Progressive enhancement: browsers without the API (or users who opted out
	// of motion) just get the instant swap.
	onNavigate((nav) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const menu = document.querySelector('[data-shell-nav]');
		const link =
			nav.type === 'link' && nav.event.target instanceof Element
				? nav.event.target.closest('a')
				: null;
		const back =
			nav.type === 'popstate'
				? nav.delta < 0
				: link?.dataset.transition === 'back' || depth(nav.to?.url) < depth(nav.from?.url);
		const root = document.documentElement;
		root.dataset.transition = back ? 'back' : 'forward';

		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await nav.complete;
				root.dataset.sidebar =
					menu === document.querySelector('[data-shell-nav]') ? 'stable' : 'swap';
			});
			transition.finished.finally(() => {
				delete root.dataset.transition;
				delete root.dataset.sidebar;
			});
		});
	});
</script>

<style>
	:global(::view-transition-old(shell-nav)),
	:global(::view-transition-new(shell-nav)) {
		--shift: 18px;
		animation-duration: 180ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		animation-fill-mode: both;
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

	:global(html[data-transition='forward']::view-transition-old(shell-nav)),
	:global(html[data-transition='forward']::view-transition-old(shell-main)) {
		animation-name: oldleft;
	}

	:global(html[data-transition='forward']::view-transition-new(shell-nav)),
	:global(html[data-transition='forward']::view-transition-new(shell-main)) {
		animation-name: newright;
	}

	:global(html[data-transition='back']::view-transition-old(shell-nav)),
	:global(html[data-transition='back']::view-transition-old(shell-main)) {
		animation-name: oldright;
	}

	:global(html[data-transition='back']::view-transition-new(shell-nav)),
	:global(html[data-transition='back']::view-transition-new(shell-main)) {
		animation-name: newleft;
	}

	:global(html[data-sidebar='stable']::view-transition-old(shell-nav)) {
		opacity: 0;
		animation: none;
	}

	:global(html[data-sidebar='stable']::view-transition-new(shell-nav)) {
		animation: none;
	}

	:global(::view-transition-old(shell-header)) {
		opacity: 0;
		animation: none;
	}

	:global(::view-transition-new(shell-header)) {
		animation: none;
		mix-blend-mode: normal;
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
		:global(::view-transition-old(shell-nav)),
		:global(::view-transition-new(shell-nav)),
		:global(::view-transition-old(shell-main)),
		:global(::view-transition-new(shell-main)),
		:global(::view-transition-old(shell-header)),
		:global(::view-transition-new(shell-header)) {
			animation: none;
		}
	}
</style>
