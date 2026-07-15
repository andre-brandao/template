<script lang="ts">
	import type { Range } from '@template/ui';
	import { getCalendar } from '../../api/insights.remote';
	import Section from './Section.svelte';
	import CalendarChart from './CalendarChart.svelte';

	let { range }: { range: Range } = $props();

	const data = $derived(await getCalendar(range));
</script>

<Section title="Created">
	{#if data.total > 0}
		<!-- {#key}: layerchart 2.0.0-next crashes the tab on in-place data updates; remount instead -->
		{#key data}
			<CalendarChart {data} />
		{/key}
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
