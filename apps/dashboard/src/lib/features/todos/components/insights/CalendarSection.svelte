<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty } from '@template/ui';
	import { calendar } from '../../api/todos.query';
	import Section from './Section.svelte';
	import CalendarChart from './CalendarChart.svelte';

	let { range }: { range: Insights.Range } = $props();

	const query = createQuery(() => calendar(range));
</script>

<Section title="Created" {query} height="180px">
	{#snippet children(data)}
		{#if data.total > 0}
			<CalendarChart {data} />
		{:else}
			<Empty>No todos created in this range</Empty>
		{/if}
	{/snippet}
</Section>
