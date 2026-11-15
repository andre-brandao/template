<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty } from '@template/ui';
	import { barX, defineChart, stack, text } from '@tanstack/charts';
	import { scaleBand } from '@tanstack/charts/scales/band';
	import { scaleLinear } from '@tanstack/charts/scales/linear';
	import { Chart } from '@tanstack/charts/svelte';
	import { tooltip } from '@tanstack/charts/tooltip';
	import { portal } from '@tanstack/charts/tooltip/portal';
	import { load } from '../../api/todos.query';
	import { color } from '../../status';
	import Section from './Section.svelte';

	let { range }: { range: Insights.Range } = $props();

	const query = createQuery(() => load(range));
	const rows = $derived(query.data?.rows ?? []);

	// Only the buckets that mean work-in-hand; done is shown as the tail of the bar.
	const parts = ['active', 'blocked', 'planned', 'done'] as const;

	const trim = (name: string) => (name.length > 18 ? `${name.slice(0, 17)}…` : name);

	const segments = $derived(
		rows.flatMap((row) =>
			parts
				.filter((part) => row[part] > 0)
				.map((part) => ({ name: trim(row.name), part, count: row[part] }))
		)
	);

	const definition = $derived(
		defineChart({
			marks: [
				barX(segments, {
					x: 'count',
					y: 'name',
					color: 'part',
					inset: 0,
					layout: stack({ order: [...parts] })
				}),
				// At the bar's end: `total` also counts backlog, which the bar leaves out.
				text(rows, {
					x: (row) => parts.reduce((sum, part) => sum + row[part], 0),
					y: (row) => trim(row.name),
					text: 'total',
					anchor: 'start',
					dx: 8,
					fill: 'var(--muted)',
					fontSize: 11
				})
			],
			scales: {
				x: { scale: scaleLinear, axis: false },
				y: { scale: () => scaleBand().padding(0.3), axis: { line: false, ticks: { size: 0 } } }
			},
			color: { domain: [...parts], range: parts.map(color) },
			margin: { right: 28 },
			tooltip: {
				use: tooltip,
				portal,
				format: (point) =>
					'part' in point.datum ? `${point.datum.count} ${point.datum.part}` : ''
			}
		})
	);
</script>

<Section title="By assignee" {query} height="152px">
	{#snippet children(data)}
		{#if data.rows.length === 0}
			<Empty>No tasks in this range</Empty>
		{:else}
			<Chart
				{definition}
				ariaLabel="Open and done todos per assignee"
				height={data.rows.length * 36 + 8}
			/>
		{/if}
	{/snippet}
</Section>
