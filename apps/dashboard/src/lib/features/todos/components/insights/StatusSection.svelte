<script lang="ts">
	import type { Range } from '@template/ui';
	import { getStatus } from '../../api/insights.remote';
	import Section from './Section.svelte';
	import StatusChart from './StatusChart.svelte';

	let { range }: { range: Range } = $props();

	const status = $derived(await getStatus(range));
</script>

<Section title="By status">
	{#if status.total > 0}
		<StatusChart rows={status.rows} />
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
