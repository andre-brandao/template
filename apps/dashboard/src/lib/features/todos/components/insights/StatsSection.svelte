<script lang="ts">
	import type { Range } from '@template/ui';
	import { getCounts, getOverdue } from '../../api/insights.remote';
	import StatTile from './StatTile.svelte';

	let { range }: { range: Range } = $props();

	const counts = $derived(await getCounts(range));
	const overdue = $derived(await getOverdue());
	const total = $derived(Object.values(counts).reduce((sum, n) => sum + n, 0));
	const done = $derived(counts.done ?? 0);
	const rate = $derived(total === 0 ? 0 : Math.round((done / total) * 100));
</script>

<div class="tiles">
	<StatTile label="Created" value={String(total)} hint="in range" />
	<StatTile label="Completion" value="{rate}%" hint="{done} done" />
	<StatTile label="In progress" value={String(counts.in_progress ?? 0)} />
	<StatTile label="Overdue" value={String(overdue)} hint="all time" tone={overdue > 0 ? 'danger' : 'default'} />
</div>

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75em;
	}
</style>
