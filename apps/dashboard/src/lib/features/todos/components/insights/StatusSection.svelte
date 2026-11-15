<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty } from '@template/ui';
	import { statuses } from '../../api/todos.query';
	import Section from './Section.svelte';
	import StatusChart from './StatusChart.svelte';

	let { range }: { range: Insights.Range } = $props();

	const query = createQuery(() => statuses(range));
</script>

<Section title="By status" {query} height="300px">
	{#snippet children(data)}
		{#if data.total > 0}
			<StatusChart rows={data.rows} />
		{:else}
			<Empty>No tasks in this range</Empty>
		{/if}
	{/snippet}
</Section>
