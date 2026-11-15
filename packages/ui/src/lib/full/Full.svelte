<script lang="ts">
	import IconButton from '../input/IconButton.svelte';

	// Inline rather than a glyph: the ⛶ codepoint has no glyph in many system fonts.
	const grow =
		'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3';
	const shrink =
		'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3';

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

<IconButton label={big ? 'Exit full screen' : 'Full screen'} size="sm" onclick={full}>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
	>
		<path d={big ? shrink : grow} />
	</svg>
</IconButton>

<style>
	svg {
		width: 13px;
		height: 13px;
	}
</style>
