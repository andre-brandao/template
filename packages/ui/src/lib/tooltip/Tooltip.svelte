<script lang="ts">
	import type { Snippet } from 'svelte';
	import { place, type Place } from '../popover/place';

	let {
		tip,
		side = 'top',
		children
	}: {
		tip: string;
		side?: Place;
		children: Snippet;
	} = $props();

	const id = $props.id();

	let wrap: HTMLSpanElement | undefined = $state();
	let bubble: HTMLSpanElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;

	// The top layer, so no ancestor's `overflow` or z-index can bury it — which is the
	// whole point of a tooltip, and the reason the position has to be measured.
	function show() {
		clearTimeout(timer);
		if (!wrap || !bubble) return;
		bubble.showPopover();
		place(bubble, wrap.getBoundingClientRect(), side, 'center');
	}

	function hide() {
		clearTimeout(timer);
		bubble?.hidePopover();
	}
</script>

<!-- The description belongs on the control itself, which the caller owns, so it is
     stamped onto the first element they render inside. A pointer waits a beat so a sweep
     across dense rows doesn't flicker; Escape hides it without moving focus. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	class="wrap"
	bind:this={wrap}
	onpointerenter={() => (timer = setTimeout(show, 350))}
	onpointerleave={hide}
	onfocusin={show}
	onfocusout={hide}
	onkeydown={(e) => e.key === 'Escape' && bubble?.matches(':popover-open') && hide()}
	{@attach (el) => el.firstElementChild?.setAttribute('aria-describedby', id)}
>
	{@render children()}
	<span class="tip" bind:this={bubble} popover="manual" role="tooltip" data-side={side} {id}>
		{tip}
	</span>
</span>

<style>
	.wrap {
		display: inline-flex;
	}

	.tip {
		position: fixed;
		inset: auto;
		width: max-content;
		max-width: 16em;
		margin: 0;
		padding: 0.35em 0.55em;
		border: none;
		border-radius: var(--radius, 8px);
		background: var(--ink, #1c1b19);
		color: var(--surface, #fff);
		font-size: 0.81em;
		line-height: 1.35;
		text-align: center;
		pointer-events: none;
		opacity: 0;
		transition:
			opacity 0.12s ease,
			display 0.12s allow-discrete,
			overlay 0.12s allow-discrete;
	}

	.tip:popover-open {
		opacity: 1;
	}

	@starting-style {
		.tip:popover-open {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tip {
			transition: none;
		}
	}
</style>
