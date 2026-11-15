<!-- Six weeks of big MonthGrid cells; multi-day todos run as bars across each week row. -->
<script lang="ts">
	import { MonthGrid, shift, week, type Day, type Weekday } from '@template/ui';
	import Chip from './Chip.svelte';
	import { lanes, type Bar, type Item } from './layout';
	import type { Chips } from './CalendarView.svelte';

	let {
		month,
		focus = $bindable(),
		start,
		items,
		hit,
		chips,
		onpick,
		onmore
	}: {
		month: Day;
		focus: Day;
		start: Weekday;
		items: Item[];
		/** Days a drag in flight would cover. */
		hit: (day: Day) => boolean;
		chips: Chips;
		onpick: (day: Day) => void;
		onmore: (day: Day, e: MouseEvent) => void;
	} = $props();

	// Three lanes show; the rest of a day folds into "+N more".
	const MAX = 3;

	const days = $derived.by(() => {
		const first = week(month.slice(0, 8) + '01', start);
		const rows = Array.from({ length: 6 }, (_, w) => shift(first, { days: w * 7 }));
		return new Map(
			rows.flatMap((row) => {
				const bars = lanes(items, row);
				return Array.from({ length: 7 }, (_, c): [Day, { bars: Bar[]; more: number }] => [
					shift(row, { days: c }),
					{
						bars: bars.filter((bar) => bar.col === c && bar.lane < MAX),
						more: bars.filter((bar) => bar.lane >= MAX && bar.col <= c && c < bar.col + bar.span)
							.length
					}
				]);
			})
		);
	});
</script>

<div class="month">
	<MonthGrid {month} bind:focus {onpick}>
		{#snippet cell(info)}
			{@const day = days.get(info.day)}
			<span class={['cell', { away: info.outside, now: info.today, hit: hit(info.day) }]}>
				<span class="date">{info.date}</span>
				{#each day?.bars ?? [] as bar (bar.item.todo.id)}
					<Chip
						todo={bar.item.todo}
						time={bar.head ? chips.time(bar.item) : ''}
						head={bar.head}
						tail={bar.tail}
						edge="right"
						{...chips.mark(bar.item.todo.id)}
						grab={chips.grab}
						open={chips.open}
						style="position: absolute; z-index: 1; left: 2px; top: calc(1.75rem + {bar.lane} * 1.35rem); width: calc({bar.span *
							100}% - 4px)"
					/>
				{/each}
				{#if day?.more}
					<span
						class="more"
						role="presentation"
						onclick={(e) => {
							e.stopPropagation();
							onmore(info.day, e);
						}}>+{day.more} more</span
					>
				{/if}
			</span>
		{/snippet}
	</MonthGrid>
</div>

<style>
	.month {
		--grid-width: 100%;
		--day-width: 100%;
		--day-height: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}

	.cell {
		position: relative;
		display: block;
		height: 7.3rem;
		/* MonthGrid bolds today's whole button; only the date pill should be. */
		font-weight: 400;
		box-shadow:
			inset 0 1px 0 var(--border),
			inset -1px 0 0 var(--border);
		text-align: left;
	}

	.date {
		position: absolute;
		top: 0.35rem;
		left: 0.4rem;
		display: inline-grid;
		place-items: center;
		min-width: 1.4rem;
		height: 1.25rem;
		padding: 0 0.25rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
	}

	.away {
		background: color-mix(in oklab, var(--ink) 2.5%, transparent);
	}

	.now .date {
		background: var(--accent);
		color: var(--accent-ink);
		font-weight: 600;
	}

	.hit {
		background: var(--selected);
	}

	.more {
		position: absolute;
		left: 0.45rem;
		bottom: 0.3rem;
		color: var(--muted);
		font-size: 0.72rem;
		cursor: pointer;
	}

	.more:hover {
		color: var(--ink);
		text-decoration: underline;
	}
</style>
