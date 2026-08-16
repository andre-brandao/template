<script lang="ts">
	// Inline rather than a glyph: the ⛶ codepoint has no glyph in many system fonts.
	const grow = 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3';
	const shrink = 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3';

	// The element to blow up — whatever the caller wants full screen, usually its own frame.
	let { el }: { el?: HTMLElement } = $props();

	let big = $state(false);

	function full() {
		if (document.fullscreenElement) return void document.exitFullscreen();
		el?.requestFullscreen();
	}
</script>

<!-- The event fires on the element that entered and bubbles, so one document listener
     covers whichever frame this button belongs to. -->
<svelte:document onfullscreenchange={() => (big = !!document.fullscreenElement)} />

<button
	type="button"
	title={big ? 'Exit full screen' : 'Full screen'}
	aria-label={big ? 'Exit full screen' : 'Full screen'}
	onclick={full}
>
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
		<path d={big ? shrink : grow} />
	</svg>
</button>

<style>
	/* Scoped CSS can't cross into a child, so the button carries its own chrome and takes
	   its scale from the bar it sits in. */
	button {
		display: flex;
		align-items: center;
		padding: 0.3em;
		border: 1px solid transparent;
		border-radius: 5px;
		background: transparent;
		color: var(--muted);
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	svg {
		width: 13px;
		height: 13px;
	}
</style>
