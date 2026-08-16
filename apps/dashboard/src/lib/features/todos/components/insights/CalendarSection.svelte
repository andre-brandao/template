<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { Empty } from '@template/ui';
	import { getCalendar } from '../../api/insights.remote';
	import Section from './Section.svelte';
	import CalendarChart from './CalendarChart.svelte';

	let { range }: { range: Insights.Range } = $props();

	const data = $derived(await getCalendar(range));
</script>

<Section title="Created">
	{#if data.total > 0}
		<CalendarChart {data} />
	{:else}
		<Empty>No todos created in this range</Empty>
	{/if}
</Section>

<style>
</style>
