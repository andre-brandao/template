<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createAttachmentKey } from 'svelte/attachments';

	/**
	 * Dropdown on the native popover (top layer escapes clipping; light dismiss free).
	 * `trigger` spreads `attrs` on its button; `children` gets `close`. A top-layer
	 * element can't follow the trigger, so outside scrolls/resizes close the menu.
	 */
	let {
		trigger,
		children,
		align = 'start'
	}: {
		trigger: Snippet<[Record<string, unknown>]>;
		children: Snippet<[() => void]>;
		align?: 'start' | 'end';
	} = $props();

	const uid = $props.id();

	let open = $state(false);
	let anchor: HTMLElement | undefined = $state();
	let menu: HTMLDivElement | undefined = $state();
	let at = $state({ top: 0, left: 0 });

	// Runs after the content mounts, so it can measure the real menu and flip
	// above or clamp to the viewport instead of guessing at heights.
	function fit() {
		if (!anchor || !menu) return;
		const box = anchor.getBoundingClientRect();
		const below = window.innerHeight - box.bottom;
		at = {
			top: below < menu.offsetHeight + 8 ? Math.max(8, box.top - menu.offsetHeight - 4) : box.bottom + 4,
			left:
				align === 'end'
					? Math.max(8, box.right - menu.offsetWidth)
					: Math.min(box.left, window.innerWidth - menu.offsetWidth - 8)
		};
	}

	const close = () => open && menu?.hidePopover();
	const away = (e: Event) => menu && !menu.contains(e.target as Node) && close();

	const attrs = {
		popovertarget: `menu-${uid}`,
		'aria-haspopup': 'menu',
		get 'aria-expanded'() {
			return open;
		},
		[createAttachmentKey()]: (el: HTMLElement) => {
			anchor = el;
		}
	};
</script>

<svelte:window onscrollcapture={away} onresize={close} />

{@render trigger(attrs)}

<div
	class="menu"
	id="menu-{uid}"
	popover="auto"
	role="menu"
	style:top="{at.top}px"
	style:left="{at.left}px"
	onbeforetoggle={(e) => (open = e.newState === 'open')}
	{@attach (el) => {
		menu = el;
	}}
>
	{#if open}
		<!-- The mount flush happens while the popover is still `display: none`, so
		     measuring here reads zero — wait for the frame where it's shown. rAF
		     runs before that frame paints, so the menu never flashes misplaced. -->
		<div
			class="body"
			{@attach () => {
				const raf = requestAnimationFrame(fit);
				return () => cancelAnimationFrame(raf);
			}}
		>
			{@render children(close)}
		</div>
	{/if}
</div>

<style>
	.menu {
		position: fixed;
		inset: auto;
		margin: 0;
		padding: 0;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-2);
	}

	/* Layout-neutral: it exists only to run `fit` once the content is in the DOM. */
	.body {
		display: contents;
	}
</style>
