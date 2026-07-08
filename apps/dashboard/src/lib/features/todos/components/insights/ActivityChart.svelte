<script module lang="ts">
	export type Point = { day: string; created: number; completed: number };
</script>

<script lang="ts">
	import { Area, Axis, Chart, Highlight, Layer, Legend } from 'layerchart';

	let { series }: { series: Point[] } = $props();

	const data = $derived(series.map((point) => ({ ...point, date: new Date(`${point.day}T00:00:00`) })));
	const short = (date: Date) => date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
	const whole = (value: number) => (Number.isInteger(value) ? String(value) : '');
</script>

<Chart
	{data}
	x="date"
	yDomain={[0, null]}
	yNice
	series={[
		{ key: 'created', label: 'Created', value: (point: Point) => point.created, color: 'var(--series-1)' },
		{ key: 'completed', label: 'Completed', value: (point: Point) => point.completed, color: 'var(--series-2)' }
	]}
	tooltipContext={{ mode: 'bisect-x' }}
	padding={{ left: 24, bottom: 24 }}
	height={260}
>
	<Layer>
		<Axis placement="left" grid rule ticks={4} format={whole} />
		<Axis placement="bottom" rule format={short} />
		<Area seriesKey="created" class="fill-series-1/10" line={{ class: 'stroke-2 stroke-series-1' }} />
		<Area seriesKey="completed" class="fill-series-2/10" line={{ class: 'stroke-2 stroke-series-2' }} />
		<Highlight points lines />
	</Layer>
	<Legend placement="bottom" />
	<!-- Tooltip.Root disabled: breaks under layerchart 2.0.0-next.66 + experimental async; Highlight still tracks hover -->
</Chart>
