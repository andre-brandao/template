<script module lang="ts">
	/** Spread onto the trigger button: wires the invoker, ARIA, and the anchor. */
	export type Trigger = {
		popovertarget: string;
		'aria-haspopup': 'dialog' | 'menu';
		'aria-expanded': boolean;
		'aria-controls': string;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from 'svelte/attachments';
	import type { Snippet } from 'svelte';
	import { HotkeysProvider } from '@tanstack/svelte-hotkeys';
	import { place, type Align, type Place } from './place';

	let {
		open = $bindable(false),
		side = 'bottom',
		align = 'start',
		role = 'dialog',
		label,
		wide = false,
		trigger,
		children
	}: {
		open?: boolean;
		side?: Place;
		align?: Align;
		/** `menu` when the content is a list of actions. */
		role?: 'dialog' | 'menu';
		label?: string;
		/** Room for wide content, like a two-month calendar. */
		wide?: boolean;
		trigger?: Snippet<[Trigger]>;
		children: Snippet<[close: () => void]>;
	} = $props();

	const id = $props.id();
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
		move();
	}

	// Measured, because the top layer means no ancestor clips it and nothing positions it.
	function move() {
		if (!panel) return;
		const at = point
			? new DOMRect(point.x, point.y, 0, 0)
			: (anchor?.getBoundingClientRect() ?? new DOMRect());
		// A point opens the panel from the pointer outward, like a native context menu.
		place(panel, at, side, point ? 'start' : align);
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
	class={['popover', { wide }]}
	bind:this={panel}
	popover="auto"
	{id}
	{role}
	aria-label={label}
	tabindex="-1"
	data-side={side}
	onbeforetoggle={(e) => e.newState === 'open' && requestAnimationFrame(move)}
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
		max-width: min(var(--popover-max-width, 24em), calc(100vw - 1em));
		/* rem: a trigger in small print (a toolbar, a footer) would otherwise cramp its panel. */
		max-height: min(28rem, calc(100vh - 1em));
		overflow: auto;
		padding: 0.3em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-2);
		outline: none;
		opacity: 0;
		translate: 0 -2px;
		transition:
			opacity 0.14s ease,
			translate 0.14s ease,
			display 0.14s allow-discrete,
			overlay 0.14s allow-discrete;
	}

	.wide {
		max-width: min(var(--popover-max-width, 46em), calc(100vw - 1em));
		max-height: min(34em, calc(100vh - 1em));
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
