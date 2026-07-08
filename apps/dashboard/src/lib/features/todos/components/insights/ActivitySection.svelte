<script lang="ts">
	import type { Range } from '@template/ui';
	import { getActivity } from '../../api/insights.remote';
	import Section from './Section.svelte';
	import ActivityChart from './ActivityChart.svelte';

	let { range }: { range: Range } = $props();

	const series = $derived(await getActivity(range));
	const active = $derived(series.some((point) => point.created > 0 || point.completed > 0));
</script>

<Section title="Activity">
	{#if active}
		<!-- {#key}: layerchart 2.0.0-next crashes the tab on in-place data updates; remount instead -->
		{#key series}
			<ActivityChart {series} />
		{/key}
	{:else}
		<p class="empty">No activity in this range</p>
	{/if}
</Section>

<style>
	.empty {
		color: var(--dim);
		margin: 0;
	}
</style>
