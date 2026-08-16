<script module lang="ts">
	import type { Story } from '../story';
	import Tooltip, { type Place } from './Tooltip.svelte';
	import Button from '../input/Button.svelte';

	export const story: Story = {
		title: 'Tooltip',
		blurb:
			'A hover/focus label with no state: the bubble stays mounted and only fades, so `aria-describedby` — stamped onto the first element you render inside — always resolves. It is positioned against the trigger, not the top layer, so pick a `side` that points away from a clipping ancestor. Pointer-only by design; never put anything here that the control cannot do without.',
		of: Tooltip
	};

	const sides: Place[] = ['top', 'right', 'bottom', 'left'];
</script>

<script lang="ts">
	// import { Tooltip, Button } from '@template/ui';
</script>

<div class="row">
	{#each sides as side (side)}
		<Tooltip tip="Opens on {side}" {side}>
			<Button variant="secondary">{side}</Button>
		</Tooltip>
	{/each}
</div>

<p class="note">
	<Tooltip tip="Tab to the button — focus shows it too, and Escape is not needed because it never
		takes focus itself." side="bottom">
		<Button variant="ghost">keyboard</Button>
	</Tooltip>
</p>

<style>
	/* The bubble overhangs its trigger on every side, and the story frame clips —
	   so the demo insets itself rather than losing an edge. */
	.row {
		margin: 1.5em;
		display: flex;
		align-items: center;
		gap: 0.6em;
		flex-wrap: wrap;
	}

	.note {
		margin: 1.5em;
	}
</style>
