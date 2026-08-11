<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { defineChart } from '@tanstack/charts';
	import { colorLegend } from '@tanstack/charts/legend';
	import { pie, polar, radialArc } from '@tanstack/charts/polar';
	import { Chart } from '@tanstack/charts/svelte';
	import { tooltip } from '@tanstack/charts/tooltip';
	import { portal } from '@tanstack/charts/tooltip/portal';
	import { color, label } from '../../status';

	type Row = { status: Todo.Status; total: number; pct: number };

	let { rows }: { rows: Row[] } = $props();

	const definition = $derived(
		defineChart({
			marks: [
				polar({
					inset: 4,
					marks: [
						radialArc(pie(rows, { value: 'total' }), {
							innerRadius: ({ radius }) => radius * 0.6,
							cornerRadius: 3,
							color: (slice) => label(slice.status),
							key: 'status'
						})
					]
				})
			],
			color: {
				domain: rows.map((row) => label(row.status)),
				range: rows.map((row) => color(row.status)),
				legend: colorLegend({ placement: 'bottom' })
			},
			tooltip: {
				use: tooltip,
				portal,
				format: (point) => `${point.datum.total} ${label(point.datum.status)}`
			}
		})
	);
</script>

<Chart {definition} ariaLabel="Todos by status" height={300} />
