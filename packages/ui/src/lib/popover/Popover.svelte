<script module lang="ts">
	import type { Place } from '../tooltip/Tooltip.svelte';

	export type Align = 'start' | 'center' | 'end';

	/** Spread onto the trigger button: wires the invoker, ARIA, and the anchor. */
	export type Trigger = {
		popovertarget: string;
		'aria-haspopup': 'dialog' | 'menu';
		'aria-expanded': boolean;
		'aria-controls': string;
	};

	export type { Place };
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import type { Snippet } from 'svelte';
	import { HotkeysProvider } from '@tanstack/svelte-hotkeys';

	let {
		open = $bindable(false),
		side = 'bottom',
		align = 'start',
		role = 'dialog',
		label,
		trigger,
		children
	}: {
		open?: boolean;
		side?: Place;
		align?: Align;
		/** `menu` when the content is a list of actions. */
		role?: 'dialog' | 'menu';
		label?: string;
		trigger?: Snippet<[Trigger]>;
		children: Snippet<[close: () => void]>;
	} = $props();

	const id = $props.id();
	const gap = 6;
	const flip = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
	const key = createAttachmentKey();

	let anchor: HTMLElement | undefined = $state();
	let panel: HTMLDivElement | undefined = $state();
	// Set by `show(point)` for a context menu; cleared by a trigger-driven open.
	let point: { x: number; y: number } | undefined;

	const attrs = $derived({
		popovertarget: id,
		'aria-haspopup': role,
		'aria-expanded': open,
		'aria-controls': id,
		[key]: (el: HTMLElement) => {
			anchor = el;
		}
	});

	export function close() {
		panel?.hidePopover();
	}

	/** Opens against the trigger, or at a viewport point (a right-click). */
	export function show(at?: { x: number; y: number }) {
		point = at;
		if (!panel?.matches(':popover-open')) panel?.showPopover();
		place();
	}

	// Same measuring Tooltip does, plus alignment; the top layer means no ancestor clips it.
	function place() {
		if (!panel) return;
		const at = point
			? new DOMRect(point.x, point.y, 0, 0)
			: (anchor?.getBoundingClientRect() ?? new DOMRect());
		const own = panel.getBoundingClientRect();
		const vertical = side === 'top' || side === 'bottom';
		const along = vertical
			? { start: at.left, center: at.left + at.width / 2 - own.width / 2, end: at.right - own.width }[align]
			: { start: at.top, center: at.top + at.height / 2 - own.height / 2, end: at.bottom - own.height }[align];
		const edge = {
			top: at.top - gap - own.height,
			bottom: at.bottom + gap,
			left: at.left - gap - own.width,
			right: at.right + gap
		};
		const fits = {
			top: edge.top >= 0,
			bottom: edge.bottom + own.height <= innerHeight,
			left: edge.left >= 0,
			right: edge.right + own.width <= innerWidth
		};
		// Flips to the opposite side when there is no room, rather than covering the trigger.
		const to = fits[side] || !fits[flip[side]] ? side : flip[side];
		const pos = vertical ? { left: along, top: edge[to] } : { left: edge[to], top: along };
		panel.style.left = `${Math.max(gap, Math.min(pos.left, innerWidth - own.width - gap))}px`;
		panel.style.top = `${Math.max(gap, Math.min(pos.top, innerHeight - own.height - gap))}px`;
	}

	function toggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (!open) {
			point = undefined;
			return;
		}
		const first = panel?.querySelector<HTMLElement>(
			'[autofocus], input, textarea, select, button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
		);
		(first ?? panel)?.focus();
	}

	// `bind:open` from outside: the platform owns the real state, this only asks it.
	$effect(() => {
		if (!panel) return;
		const shown = panel.matches(':popover-open');
		if (open && !shown) show(point);
		if (!open && shown) panel.hidePopover();
	});
</script>

{@render trigger?.(attrs)}

<!-- `auto` gives light dismiss: Escape and an outside click close it, and focus goes
     back to whatever held it before. -->
<div
	class="popover"
	bind:this={panel}
	popover="auto"
	{id}
	{role}
	aria-label={label}
	tabindex="-1"
	data-side={side}
	onbeforetoggle={(e) => e.newState === 'open' && requestAnimationFrame(place)}
	ontoggle={toggle}
>
	<!-- Its own exclusive scope while open: page hotkeys pause, ones registered inside fire. -->
	<HotkeysProvider scope="popover-{id}" exclusive enabled={open}>
		{@render children(close)}
	</HotkeysProvider>
</div>

<style>
	.popover {
		position: fixed;
		inset: auto;
		margin: 0;
		min-width: 10em;
		max-width: min(24em, calc(100vw - 1em));
		max-height: min(28em, calc(100vh - 1em));
		overflow: auto;
		padding: 0.3em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius, 8px);
		background: var(--surface, #fff);
		color: var(--ink, #1c1b19);
		box-shadow: var(--shadow-2, 0 12px 28px -14px rgb(0 0 0 / 0.6));
		outline: none;
		opacity: 0;
		translate: 0 -2px;
		transition:
			opacity 0.14s ease,
			translate 0.14s ease,
			display 0.14s allow-discrete,
			overlay 0.14s allow-discrete;
	}

	.popover[data-side='top'] {
		translate: 0 2px;
	}

	.popover:popover-open {
		opacity: 1;
		translate: 0 0;
	}

	@starting-style {
		.popover:popover-open {
			opacity: 0;
			translate: 0 -2px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.popover {
			translate: none;
			transition: none;
		}
	}
</style>
