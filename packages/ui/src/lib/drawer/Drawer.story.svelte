<script module lang="ts">
	import type { Story } from '../story';
	import Drawer, { type Side } from './Drawer.svelte';
	import Button from '../input/Button.svelte';

	export const story: Story = {
		title: 'Drawer',
		blurb:
			'A native `<dialog>` sliding in from either edge. Children mount only while open, and `onclose` fires on every close.',
		of: Drawer
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { Drawer, Button, type Side } from '@template/ui';

	let open = $state(false);
	let side = $state<Side>('right');
	let closed = $state(0);

	const show = (from: Side) => {
		side = from;
		open = true;
	};
</script>

<div class="row">
	<Button onclick={() => show('left')}>Open left</Button>
	<Button variant="secondary" onclick={() => show('right')}>Open right</Button>
	<span class="count">closed {closed} {closed === 1 ? 'time' : 'times'}</span>
</div>

<Drawer bind:open {side} onclose={() => closed++}>
	<h3>Drawer contents</h3>
	<p>Click the backdrop, the ✕, or press Escape.</p>
</Drawer>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.6em;
	}

	.count {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
