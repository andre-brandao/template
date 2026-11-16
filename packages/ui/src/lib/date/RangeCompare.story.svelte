<script module lang="ts">
	import type { Story } from '../story';
	import RangeCompare from './RangeCompare.svelte';

	export const story: Story = {
		title: 'RangeCompare',
		blurb:
			'An optional companion for `RangePicker`, designed for its footer snippet. It owns comparison mode and custom dates without adding comparison state to the primary picker.',
		of: RangeCompare,
		base: { range: { start: '2026-10-18', end: '2026-11-16' } }
	};
</script>

<script lang="ts">
	import type { CompareMode } from './compare';
	import type { Range } from './day';

	let mode = $state<CompareMode>();
	let custom = $state<Range>();
</script>

<RangeCompare range={{ start: '2026-10-18', end: '2026-11-16' }} bind:mode bind:custom />

<p>{mode ?? 'none'} · {custom ? `${custom.start} → ${custom.end}` : 'automatic'}</p>

<style>
	p {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
