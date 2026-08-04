<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { getStats } from '../../api/insights.remote';
	import StatTile from './StatTile.svelte';

	let { range }: { range: Insights.Range } = $props();

	const stats = $derived(await getStats(range));
</script>

<div class="tiles">
	<StatTile label="Created" value={String(stats.total)} hint="in range" />
	<StatTile label="Completion" value="{stats.rate}%" hint="{stats.done} done" />
	<StatTile label="Active" value={String(stats.active)} hint="in flight" />
	<StatTile
		label="Blocked"
		value={String(stats.blocked)}
		tone={stats.blocked > 0 ? 'danger' : 'default'}
	/>
	<StatTile
		label="Overdue"
		value={String(stats.overdue)}
		hint="all time"
		tone={stats.overdue > 0 ? 'danger' : 'default'}
	/>
</div>

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75em;
	}
</style>
