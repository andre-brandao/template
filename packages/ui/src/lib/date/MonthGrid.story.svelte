<script module lang="ts">
	import type { Story } from '../story';
	import MonthGrid from './MonthGrid.svelte';

	export const story: Story = {
		title: 'MonthGrid',
		blurb:
			'The bare month under `Calendar`: a `role=grid` table with one roving tab stop (`focus`, bindable). Arrows move a day or a week, Home/End go to the ends of the locale week, PageUp/PageDown a month and Shift+PageUp/PageDown a year; Enter or Space picks. `look(day)` paints a cell, the `cell` snippet replaces its content. Week start and labels come from `setDates`, or the browser outside it.',
		of: MonthGrid
	};
</script>

<script lang="ts">
	// import { MonthGrid, today, shift } from '@template/ui';
	import { shift, today } from './day';

	const now = today();
	let focus = $state(now);
	let picked = $state(now);
	const busy = [shift(now, { days: 2 }), shift(now, { days: 5 })];
</script>

<div class="row">
	<MonthGrid
		month={focus}
		bind:focus
		look={(day) => ({ selected: day === picked, mark: busy.includes(day) })}
		onpick={(day) => (picked = day)}
	/>

	<MonthGrid month={now} focus={now} outside={false}>
		{#snippet cell(info)}
			<span class={{ now: info.today }}>{info.today ? 'today' : info.date}</span>
		{/snippet}
	</MonthGrid>
</div>

<p class="note">focus {focus} · picked {picked}</p>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 2em;
	}

	.now {
		font-size: 0.7em;
	}

	.note {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
