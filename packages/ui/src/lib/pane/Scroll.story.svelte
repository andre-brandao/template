<script module lang="ts">
	import type { Story } from '../story';
	import Field from '../field/Field.svelte';
	import Select from '../input/Select.svelte';
	import Scroll from './Scroll.svelte';

	export const story: Story = {
		title: 'Scroll',
		blurb:
			'Hides the native scrollbars and draws its own, so a pane scrolls the same on every platform. Sized by the caller: `fill` inside a `Fill` column, a `max-height` through `style` anywhere else.',
		of: Scroll
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { Scroll } from '@template/ui';

	let orientation = $state<'vertical' | 'horizontal' | 'both'>('vertical');

	const rows = Array.from({ length: 30 }, (_, i) => i + 1);
</script>

<div class="knobs">
	<Field label="orientation">
		<Select
			options={[
				{ value: 'vertical', label: 'vertical' },
				{ value: 'horizontal', label: 'horizontal' },
				{ value: 'both', label: 'both' }
			]}
			value={orientation}
			onchange={(e) => (orientation = e.currentTarget.value as typeof orientation)}
		/>
	</Field>
</div>

<Scroll {orientation} style="max-height: 14em; border: 1px solid var(--border); border-radius: var(--radius)">
	<div class="rows" class:wide={orientation !== 'vertical'}>
		{#each rows as row (row)}
			<p>Row {row} — the bars fade in on hover and can be dragged or clicked past.</p>
		{/each}
	</div>
</Scroll>

<p class="note">
	The same component with <code>fill</code> instead of a <code>max-height</code> is how a page-level
	pane scrolls inside <code>Fill</code>.
</p>

<style>
	.knobs {
		display: flex;
		gap: 1em;
		margin-bottom: 1em;
	}

	.rows {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0.75em;
	}

	/* Wider than any pane it lands in, so the horizontal bar has somewhere to travel. */
	.rows.wide p {
		width: 60em;
	}

	.rows p {
		margin: 0;
		font-size: 0.85em;
		color: var(--muted);
	}

	.note {
		margin-top: 1em;
		color: var(--muted);
		font-size: 0.85em;
	}

	.note code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
</style>
