<script module lang="ts">
	import type { Story } from '../story';
	import Calendar from './Calendar.svelte';

	export const story: Story = {
		title: 'Calendar',
		blurb:
			'Month grids with a header. `mode` is `single` (a day), `range` (`{ start, end }`, two clicks; the band follows the pointer or the focused day) or `multiple` (a sorted day list). `months` sets how many sit side by side; `min`, `max` and `disabled(day)` block days, which stay focusable; `marks` gets a dot. `onchange` fires on a whole pick.',
		of: Calendar as any
	};
</script>

<script lang="ts">
	// import { Calendar, setDates, today, shift, type Range } from '@template/ui';
	import { shift, today, type Range } from './day';

	const now = today();
	let day = $state(now);
	let range: Range = $state({ start: shift(now, { days: -3 }), end: now });
	let many: string[] = $state([]);
</script>

<div class="row">
	<section>
		<h4>single · weekends off · marks</h4>
		<Calendar
			bind:value={day}
			disabled={(one) => [0, 6].includes(new Date(one + 'T12:00').getDay())}
			marks={[shift(now, { days: 1 }), shift(now, { days: 8 })]}
		/>
		<code>{day}</code>
	</section>

	<section>
		<h4>multiple</h4>
		<Calendar mode="multiple" bind:value={many} />
		<code>{many.join(', ') || '—'}</code>
	</section>
</div>

<section>
	<h4>range · two months · max today · 14 days at most</h4>
	<Calendar mode="range" months={2} bind:value={range} max={now} maxSpan={14} />
	<code>{range.start} → {range.end}</code>
</section>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 2em;
	}

	section {
		display: grid;
		justify-items: start;
		gap: 0.4em;
		margin-bottom: 1.4em;
	}

	h4 {
		margin: 0;
		color: var(--dim);
		font-size: 0.78em;
		font-weight: 500;
	}

	code {
		color: var(--muted);
		font-size: 0.78em;
	}
</style>
