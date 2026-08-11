<script lang="ts">
	import type { Insights } from '@template/core/todo';
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
		<p class="empty">No todos created in this range</p>
	{/if}
</Section>

<style>
	.empty {
		color: var(--dim);
		margin: 0;
	}
</style>
