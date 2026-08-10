<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { getActivity } from '../../api/insights.remote';
	import Section from './Section.svelte';
	import ActivityChart from './ActivityChart.svelte';

	let { range }: { range: Insights.Range } = $props();

	const activity = $derived(await getActivity(range));
</script>

<Section title="Activity">
	{#if activity.active}
		<ActivityChart series={activity.series} />
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
