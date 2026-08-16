<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	// A scroller that draws its own bars: the native ones are hidden, so a pane looks the
	// same on every platform instead of inheriting whatever the OS paints. The caller sizes
	// it — `fill` inside a flex column, a `max-height` through `style` anywhere else.
	let {
		orientation = 'vertical',
		fill = false,
		style,
		children
	}: {
		orientation?: 'vertical' | 'horizontal' | 'both';
		fill?: boolean;
		style?: string;
		children: Snippet;
	} = $props();

	// Every name the maths needs, per axis, so nothing below branches on direction: the DOM
	// properties to read, the pointer coordinate, and the two CSS sides the thumb sits on.
	const axes = {
		y: {
			at: 'scrollTop',
			box: 'clientHeight',
			len: 'scrollHeight',
			point: 'clientY',
			span: 'height',
			edge: 'top',
			way: 'vertical'
		},
		x: {
			at: 'scrollLeft',
			box: 'clientWidth',
			len: 'scrollWidth',
			point: 'clientX',
			span: 'width',
			edge: 'left',
			way: 'horizontal'
		}
	} as const;

	type Axis = keyof typeof axes;

	const on = $derived({
		y: orientation !== 'horizontal',
		x: orientation !== 'vertical'
	});

	const id = $props.id();

	let view = $state<HTMLElement>();
	let held = $state(false);

	// Per axis, both as fractions of the track: how long the thumb is and how far along it
	// sits. Fractions rather than pixels so the markup is two percentages and no maths.
	let bars = $state({ y: { size: 0, at: 0 }, x: { size: 0, at: 0 } });

	const shown = $derived((['y', 'x'] as const).filter((key) => on[key] && bars[key].size));

	// A thumb shorter than this is not worth grabbing, so it stops shrinking here.
	const MIN = 24;

	function track(el: HTMLElement, key: Axis) {
		const ax = axes[key];
		const box = el[ax.box];
		const len = el[ax.len];
		if (len <= box + 1) return { size: 0, at: 0 };
		const size = Math.max(MIN / box, box / len);
		return { size, at: (el[ax.at] / (len - box)) * (1 - size) };
	}

	function measure() {
		if (!view) return;
		bars = { y: track(view, 'y'), x: track(view, 'x') };
	}

	// Takes the element and watches it in one go. The observer is the only way the thumb hears
	// about content that arrives late — a list that loads, a panel that reflows — since
	// neither fires a scroll event.
	const watch: Attachment<HTMLElement> = (el) => {
		view = el;
		const obs = new ResizeObserver(measure);
		obs.observe(el);
		[...el.children].forEach((child) => obs.observe(child));
		measure();
		return () => obs.disconnect();
	};

	const scroll = (key: Axis, to: number) =>
		view?.scrollTo({ [axes[key].edge]: to, behavior: 'instant' });

	// One handler for the whole bar, split by where the press landed: on the thumb it drags,
	// off it pages toward the click the way a real scrollbar does.
	function press(e: PointerEvent, key: Axis) {
		if (!view) return;
		const ax = axes[key];
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		const bar = bars[key];
		const box = view[ax.box];
		const from = view[ax.at];
		const past = (e[ax.point] - rect[ax.edge]) / rect[ax.span];

		// Keeps the press off the bar itself: no focus ring on a `tabindex="-1"` scrollbar, no
		// text caret dropped in the pane, no selection drag.
		e.preventDefault();

		if (past < bar.at || past > bar.at + bar.size)
			return scroll(key, past > bar.at ? from + box : from - box);

		// The pointer is captured so the drag survives leaving the track, and the travel is
		// scaled back up by however far the content overshoots the box.
		const reach = (view[ax.len] - box) / (box * (1 - bar.size));
		const start = e[ax.point];
		el.setPointerCapture(e.pointerId);
		held = true;

		const move = (e: PointerEvent) => scroll(key, from + (e[ax.point] - start) * reach);
		const drop = () => {
			held = false;
			el.removeEventListener('pointermove', move);
		};
		el.addEventListener('pointermove', move);
		el.addEventListener('pointerup', drop, { once: true });
		el.addEventListener('pointercancel', drop, { once: true });
	}
</script>

<div class="root" class:fill {style}>
	<div class="view" class:y={on.y} class:x={on.x} {@attach watch} onscroll={measure} {id}>
		<div class="content">{@render children()}</div>
	</div>

	{#each shown as key (key)}
		{@const ax = axes[key]}
		{@const bar = bars[key]}
		<div
			class="bar {key}"
			class:held
			role="scrollbar"
			aria-controls={id}
			aria-orientation={ax.way}
			aria-valuenow={Math.round(bar.at * 100)}
			tabindex="-1"
			onpointerdown={(e) => press(e, key)}
		>
			<div class="thumb" style="{ax.span}: {bar.size * 100}%; {ax.edge}: {bar.at * 100}%"></div>
		</div>
	{/each}
</div>

<style>
	/* A column so a `max-height` on the root caps the view rather than spilling past it —
	   the view is what scrolls, and it can only scroll once something bounds its height. */
	.root {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
	}

	.root.fill {
		flex: 1;
	}

	.view {
		flex: 1;
		min-height: 0;
		width: 100%;
		/* The bars below are the scrollbars; the real ones would sit under them. */
		scrollbar-width: none;
	}

	.view::-webkit-scrollbar {
		display: none;
	}

	.view.y {
		overflow-y: auto;
		/* Reaching the end shouldn't hand the scroll to the document behind it. */
		overscroll-behavior-y: contain;
	}

	.view.x {
		overflow-x: auto;
		overscroll-behavior-x: contain;
	}

	/* `fit-content` so a row of children keeps its width instead of being squeezed into the
	   box — without it there is nothing to scroll sideways to. */
	.content {
		min-width: fit-content;
	}

	/* Overlaid rather than in the flow: reserving a gutter would shift the content sideways
	   the moment a list grew long enough to scroll. */
	.bar {
		position: absolute;
		user-select: none;
		opacity: 0;
		transition: opacity 0.15s;
		/* The bar owns the gesture — a drag on it must not scroll the page underneath. */
		touch-action: none;
	}

	.bar.y {
		inset: 0 0 0 auto;
		width: 8px;
	}

	.bar.x {
		inset: auto 0 0 0;
		height: 8px;
	}

	.root:hover .bar,
	.root:focus-within .bar,
	.bar.held {
		opacity: 1;
	}

	.thumb {
		position: absolute;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink, #17181a) 25%, transparent);
	}

	.bar.y .thumb {
		right: 2px;
		width: 4px;
	}

	.bar.x .thumb {
		bottom: 2px;
		height: 4px;
	}

	.thumb:hover,
	.bar.held .thumb {
		background: color-mix(in srgb, var(--ink, #17181a) 45%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.bar {
			transition: none;
		}
	}
</style>
