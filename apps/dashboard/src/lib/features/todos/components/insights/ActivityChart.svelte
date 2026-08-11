<script module lang="ts">
	export type Point = { day: string; created: number; completed: number };
</script>

<script lang="ts">
	import { areaY, crosshair, defineChart, lineY } from '@tanstack/charts';
	import { colorLegend } from '@tanstack/charts/legend';
	import { scaleLinear } from '@tanstack/charts/scales/linear';
	import { Chart } from '@tanstack/charts/svelte';
	import { tooltip } from '@tanstack/charts/tooltip';
	import { portal } from '@tanstack/charts/tooltip/portal';
	import { scaleTime } from 'd3-scale';

	let { series }: { series: Point[] } = $props();

	const date = (point: Point) => new Date(`${point.day}T00:00:00`);
	const short = (day: Date) => day.toLocaleDateString('en', { month: 'short', day: 'numeric' });
	const whole = (value: number) => (Number.isInteger(value) ? String(value) : '');

	const rows = $derived(
		series.flatMap((point) => [
			{ date: date(point), kind: 'Created', value: point.created },
			{ date: date(point), kind: 'Completed', value: point.completed }
		])
	);

	const definition = $derived(
		defineChart({
			marks: [
				areaY(rows, { x: 'date', y1: 0, y2: 'value', z: 'kind', color: 'kind', fillOpacity: 0.1 }),
				lineY(rows, { x: 'date', y: 'value', color: 'kind', strokeWidth: 2 }),
				crosshair({ x: { strokeDasharray: '3 3' }, y: false })
			],
			x: { scale: scaleTime, axis: { ticks: { format: short } } },
			y: { scale: scaleLinear, nice: true, grid: true, axis: { ticks: { count: 4, format: whole } } },
			color: {
				domain: ['Created', 'Completed'],
				range: ['var(--series-1)', 'var(--series-2)'],
				legend: colorLegend({ placement: 'bottom' })
			},
			focus: 'group-x',
			tooltip: {
				use: tooltip,
				portal,
				items: [{ channel: 'x', text: (point) => short(point.xValue as Date) }, { channel: 'y' }]
			}
		})
	);
</script>

<Chart {definition} ariaLabel="Todos created and completed per day" height={300} />
