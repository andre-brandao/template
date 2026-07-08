<script lang="ts">
	import type { Range } from '@template/ui';
	import { getActivity } from '../../api/insights.remote';
	import Section from './Section.svelte';
	import ActivityChart from './ActivityChart.svelte';

	let { range }: { range: Range } = $props();

	const activity = $derived(await getActivity(range));
</script>

<Section title="Activity">
	{#if activity.active}
		<!-- {#key}: layerchart 2.0.0-next crashes the tab on in-place data updates; remount instead -->
		{#key activity.series}
			<ActivityChart series={activity.series} />
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
