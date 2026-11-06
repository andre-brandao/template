<!--
	The assistant beside the page: a sticky column that slides open on desktop, the whole screen
	on a phone or in full screen. Kept mounted while closed, so its page tools outlive a closed
	dock mid-run.
-->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { innerWidth } from 'svelte/reactivity/window';
	import { agent } from '../agent.svelte';
	import Agent from './Agent.svelte';

	const ctx = agent();
	// The Shell's breakpoint: below it the column becomes the whole screen.
	const narrow = new MediaQuery('max-width: 700px');
	const full = $derived(ctx.open && (ctx.full || narrow.current));

	const min = 320;
	const max = $derived(Math.round(Math.max(min, Math.min(900, (innerWidth.current ?? 1500) * 0.6))));
	const clamp = (px: number) => Math.round(Math.min(Math.max(px, min), max));
	// The live width mid-drag; only the release is saved.
	let drag = $state<number>();
	const width = $derived(clamp(drag ?? ctx.width));

	// One width update per frame, however fast the pointer reports.
	function grab(event: PointerEvent) {
		if (event.button !== 0) return;
		const handle = event.currentTarget as HTMLElement;
		const start = event.clientX;
		const base = width;
		let x = start;
		let frame = 0;
		handle.setPointerCapture(event.pointerId);
		drag = base;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		const move = (e: PointerEvent) => {
			x = e.clientX;
			frame ||= requestAnimationFrame(() => {
				frame = 0;
				drag = base + start - x;
			});
		};
		handle.addEventListener('pointermove', move);
		handle.addEventListener(
			'lostpointercapture',
			() => {
				cancelAnimationFrame(frame);
				handle.removeEventListener('pointermove', move);
				document.body.style.cursor = '';
				document.body.style.userSelect = '';
				drag = undefined;
				// A plain click (or the two halves of a double-click) saves nothing.
				if (x !== start) ctx.width = clamp(base + start - x);
			},
			{ once: true }
		);
	}

	// The handle sits on the left edge, so ← widens.
	function key(event: KeyboardEvent) {
		const next = new Map([
			['ArrowLeft', width + 24],
			['ArrowRight', width - 24],
			['Home', min],
			['End', max]
		]).get(event.key);
		if (next === undefined) return;
		event.preventDefault();
		ctx.width = clamp(next);
	}
</script>

<div
	class={['dock', { open: ctx.open, full, dragging: drag !== undefined }]}
	style:--width="{width}px"
	inert={!ctx.open}
	role="complementary"
	aria-label="Assistant"
>
	{#if ctx.open && !full}
		<!-- A focusable separator is an ARIA widget (a splitter); Svelte's list misses it. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<div
			class="handle"
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize assistant"
			aria-valuenow={width}
			aria-valuemin={min}
			aria-valuemax={max}
			tabindex="0"
			onpointerdown={grab}
			onkeydown={key}
			ondblclick={() => (ctx.width = undefined)}
		></div>
	{/if}
	<!-- Full width while the column slides, so the chat clips instead of reflowing. -->
	<div class="pane"><Agent /></div>
</div>

<style>
	.dock {
		position: sticky;
		top: 0;
		width: 0;
		height: 100dvh;
		flex-shrink: 0;
		overflow: hidden;
		background: var(--surface);
		transition: var(--slide);
		z-index: 25;
	}

	/* 60vw repeats the drag clamp, so a width remembered on a wider window still fits. */
	.dock.open {
		width: min(var(--width), 60vw);
		border-left: 1px solid var(--border);
	}

	.dock.dragging {
		transition: none;
	}

	.pane {
		width: min(var(--width), 60vw);
		height: 100%;
	}

	.full .pane {
		width: 100%;
	}

	/* An 8px hit area over the left border; the 2px line is all that shows. */
	.handle {
		position: absolute;
		inset-block: 0;
		left: 0;
		z-index: 1;
		width: 8px;
		cursor: col-resize;
		touch-action: none;
	}

	.handle::after {
		content: '';
		position: absolute;
		inset-block: 0;
		left: 0;
		width: 2px;
		background: transparent;
		transition: background 120ms ease;
	}

	.handle:hover::after,
	.handle:focus-visible::after,
	.dragging .handle::after {
		background: var(--accent);
	}

	.handle:focus-visible {
		outline: none;
	}

	.dock.full {
		position: fixed;
		inset: 0;
		width: auto;
		height: auto;
		border-left: none;
		z-index: 40;
		transition: none;
	}
</style>
