<script lang="ts">
	import type { Range } from '@template/ui';
	import { getCounts } from '../../api/insights.remote';
	import Section from './Section.svelte';
	import StatusChart from './StatusChart.svelte';

	let { range }: { range: Range } = $props();

	const counts = $derived(await getCounts(range));
	const total = $derived(Object.values(counts).reduce((sum, n) => sum + n, 0));
</script>

<Section title="By status">
	{#if total > 0}
		<StatusChart {counts} />
	{:else}
		<p class="empty">No tasks in this range</p>
	{/if}
</Section>

<style>
	.empty {
		color: var(--dim);
		margin: 0;
	}
</style>
