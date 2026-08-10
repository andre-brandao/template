<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { barX, defineChart, text } from '@tanstack/charts';
	import { scaleBand } from '@tanstack/charts/scales/band';
	import { scaleLinear } from '@tanstack/charts/scales/linear';
	import { Chart } from '@tanstack/charts/svelte';
	import { color, label } from '../../status';

	type Row = { status: Todo.Status; total: number; pct: number };

	let { rows }: { rows: Row[] } = $props();

	const name = (row: Row) => label(row.status);
	const paint = (row: Row) => color(row.status);

	const definition = $derived(
		defineChart({
			marks: [
				barX(rows, { x: 'total', y: name, fill: paint, radius: 4, inset: 2, maxThickness: 18 }),
				text(rows, {
					x: 'total',
					y: name,
					text: 'total',
					anchor: 'start',
					dx: 8,
					fill: 'var(--muted)',
					fontSize: 11
				})
			],
			x: { scale: scaleLinear, axis: false },
			y: { scale: () => scaleBand().padding(0.3), axis: { line: false, ticks: { size: 0 } } },
			margin: { right: 28 },
			focus: false
		})
	);
</script>

<Chart {definition} ariaLabel="Todos by status" height={rows.length * 36 + 8} />
