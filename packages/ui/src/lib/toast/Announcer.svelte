<script lang="ts">
	import { voice } from './announce.svelte';
</script>

<!-- The app's single assertive region, fed by failed `Status` dots. A manual popover, re-promoted
     each time it clears, so it sits above an open modal instead of going inert behind it. -->
<p
	popover="manual"
	aria-live="assertive"
	aria-atomic="true"
	{@attach (el) => {
		if (voice.text) return;
		el.togglePopover(false);
		el.showPopover();
	}}
>
	{voice.text}
</p>

<style>
	p {
		position: fixed;
		inset: auto;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		border: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
