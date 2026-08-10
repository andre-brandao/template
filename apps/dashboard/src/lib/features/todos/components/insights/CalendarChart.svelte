<script module lang="ts">
	export type Data = {
		start: string;
		end: string;
		max: number;
		total: number;
		days: { day: string; count: number }[];
	};
</script>

<script lang="ts">
	import { cell, defineChart } from '@tanstack/charts';
	import { scaleBand } from '@tanstack/charts/scales/band';
	import { Chart } from '@tanstack/charts/svelte';
	import { tooltip } from '@tanstack/charts/tooltip';
	import { portal } from '@tanstack/charts/tooltip/portal';

	let { data }: { data: Data } = $props();

	let width = $state(0);

	const DAY = 86_400_000;
	const at = (iso: string) => new Date(`${iso}T00:00:00`);
	const short = (day: Date) => day.toLocaleDateString('en', { month: 'short', day: 'numeric' });

	// GitHub-style 5-step ramp: 0 empty, then quartiles of the busiest day.
	const level = (n: number) =>
		n === 0 || data.max === 0 ? 0 : Math.min(4, Math.ceil((n / data.max) * 4));

	// One row per day from start..end inclusive, zero-filled; weeks are Sunday-started columns.
	const grid = $derived.by(() => {
		const counts = new Map(data.days.map((d) => [d.day, d.count]));
		const start = at(data.start);
		const stop = at(data.end);
		const sunday = new Date(start.getTime() - start.getDay() * DAY);
		const rows = [];
		const ticks = [];
		const labels = new Map<number, string>();
		for (const date = new Date(start); date <= stop; date.setDate(date.getDate() + 1)) {
			const day = date.toLocaleDateString('en-CA');
			// Math.round absorbs DST hour shifts in the day distance.
			const week = Math.floor(Math.round((date.getTime() - sunday.getTime()) / DAY) / 7);
			const count = counts.get(day) ?? 0;
			const first = rows.length === 0 || date.getDate() === 1;
			if (first && !labels.has(week)) {
				ticks.push(week);
				labels.set(week, date.toLocaleDateString('en', { month: 'short' }));
			}
			rows.push({ day, date: new Date(date), week, weekday: date.getDay(), count, level: level(count) });
		}
		const weeks = [...new Set(rows.map((row) => row.week))];
		return { rows, weeks, ticks, labels };
	});

	// Square GitHub-style cells: size follows the container but never balloons on short
	// ranges — the grid stays compact and left-aligned, overflowing into a scroll if tight.
	const size = $derived(Math.min(22, Math.max(10, Math.floor((width || 640) / grid.weeks.length))));

	const definition = $derived(
		defineChart({
			marks: [
				cell(grid.rows, {
					x: 'week',
					y: 'weekday',
					color: 'level',
					key: 'day',
					inset: 0,
					radius: 2,
					stroke: 'color-mix(in oklab, var(--ink) 4%, transparent)',
					strokeWidth: 1
				})
			],
			x: {
				scale: scaleBand<number>().domain(grid.weeks).paddingInner(0.08).paddingOuter(0),
				axis: {
					line: false,
					ticks: {
						values: grid.ticks,
						size: 0,
						format: (week: number) => grid.labels.get(week) ?? ''
					}
				}
			},
			y: {
				scale: scaleBand<number>().domain([0, 1, 2, 3, 4, 5, 6]).paddingInner(0.08).paddingOuter(0),
				axis: false
			},
			color: { domain: [0, 1, 2, 3, 4], range: [0, 1, 2, 3, 4].map((n) => `var(--cal-${n})`) },
			margin: { top: 4, right: 0, bottom: 24, left: 0 },
			tooltip: {
				use: tooltip,
				portal,
				anchor: 'point',
				offset: 5,
				format: (point) => `${point.datum.count} created · ${short(point.datum.date)}`
			}
		})
	);
</script>

<div class="grid" bind:clientWidth={width}>
	<Chart
		{definition}
		ariaLabel="Todos created per day, weeks as columns"
		width={grid.weeks.length * size}
		height={7 * size + 28}
	/>
</div>

<div class="scale">
	<span>{data.total} created</span>
	<div class="legend">
		<span>Less</span>
		{#each [0, 1, 2, 3, 4] as n (n)}
			<span class="swatch" style:background="var(--cal-{n})"></span>
		{/each}
		<span>More</span>
	</div>
</div>

<style>
	.grid {
		overflow-x: auto;
	}

	.scale {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
		margin-top: 0.5em;
		font-size: 0.78em;
		color: var(--dim);
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}

	.swatch {
		width: 11px;
		height: 11px;
		border-radius: 2px;
	}
</style>
