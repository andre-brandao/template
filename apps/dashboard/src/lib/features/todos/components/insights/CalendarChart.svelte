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
	import { Calendar, Chart, Svg } from 'layerchart';

	let { data }: { data: Data } = $props();

	const DAY = 86_400_000;
	const at = (iso: string) => new Date(`${iso}T00:00:00`);

	const start = $derived(at(data.start));
	// timeDays(start, end) excludes `end`, so bump a day to render the final date.
	const end = $derived(new Date(at(data.end).getTime() + DAY));

	// One point per active day; Calendar keys cells to these by date value (d3 InternMap).
	const points = $derived(data.days.map((d) => ({ date: at(d.day), count: d.count })));

	// GitHub-style 5-step ramp: 0 empty, then quartiles of the busiest day.
	const level = (n: number) =>
		n === 0 || data.max === 0 ? 0 : Math.min(4, Math.ceil((n / data.max) * 4));
	const fill = (n: number) => `var(--cal-${level(n)})`;
	const label = (d: Date) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' });

	const months = (cells: { x: number; data: { date: Date } }[]) =>
		cells
			.filter((c, i) => i === 0 || c.data.date.getMonth() !== cells[i - 1].data.date.getMonth())
			.map((c) => ({ x: c.x, name: c.data.date.toLocaleDateString('en', { month: 'short' }) }));
</script>

<Chart data={points} x={(p) => p.date} height={132} padding={{ top: 18, bottom: 4, left: 4, right: 4 }}>
	<Svg>
		<Calendar {start} {end} monthLabel={false}>
			{#snippet children({ cells, cellSize })}
				{@const gap = Math.min(2, cellSize[0] * 0.14)}
				{#each months(cells) as month (month.x)}
					<text x={month.x} y={-7} class="month">{month.name}</text>
				{/each}
				{#each cells as cell (cell.data.date.getTime())}
					<rect
						x={cell.x}
						y={cell.y}
						width={cellSize[0] - gap}
						height={cellSize[1] - gap}
						rx="2"
						fill={fill(cell.data.count ?? 0)}
						class="cell"
					>
						<title>{cell.data.count ?? 0} created · {label(cell.data.date)}</title>
					</rect>
				{/each}
			{/snippet}
		</Calendar>
	</Svg>
</Chart>

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
	.month {
		fill: var(--dim);
		font-size: 10px;
		font-family: var(--font-mono);
	}

	.cell {
		stroke: color-mix(in oklab, var(--ink) 4%, transparent);
		stroke-width: 1;
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
