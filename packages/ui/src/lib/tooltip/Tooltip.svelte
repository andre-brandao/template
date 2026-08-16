<script module lang="ts">
	export type Place = 'top' | 'bottom' | 'left' | 'right';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

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
	const gap = 6;

	let wrap: HTMLSpanElement | undefined = $state();
	let bubble: HTMLSpanElement | undefined = $state();

	// The top layer, so no ancestor's `overflow` or z-index can bury it — which is the
	// whole point of a tooltip, and the reason the position has to be measured.
	function show() {
		if (!wrap || !bubble) return;
		bubble.showPopover();
		const at = wrap.getBoundingClientRect();
		const own = bubble.getBoundingClientRect();
		const x = {
			top: at.left + at.width / 2 - own.width / 2,
			bottom: at.left + at.width / 2 - own.width / 2,
			left: at.left - own.width - gap,
			right: at.right + gap
		}[side];
		const y = {
			top: at.top - own.height - gap,
			bottom: at.bottom + gap,
			left: at.top + at.height / 2 - own.height / 2,
			right: at.top + at.height / 2 - own.height / 2
		}[side];
		// Nudged back inside rather than letting a long tip run off the edge.
		bubble.style.left = `${Math.max(gap, Math.min(x, innerWidth - own.width - gap))}px`;
		bubble.style.top = `${Math.max(gap, Math.min(y, innerHeight - own.height - gap))}px`;
	}
</script>

<!-- The description belongs on the control itself, which the caller owns, so it is
     stamped onto the first element they render inside. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
	class="wrap"
	bind:this={wrap}
	onpointerenter={show}
	onpointerleave={() => bubble?.hidePopover()}
	onfocusin={show}
	onfocusout={() => bubble?.hidePopover()}
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
		border-radius: var(--radius, 6px);
		background: var(--ink, #111);
		color: var(--surface, #fff);
		font-family: var(--font-mono, monospace);
		font-size: 0.72em;
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
