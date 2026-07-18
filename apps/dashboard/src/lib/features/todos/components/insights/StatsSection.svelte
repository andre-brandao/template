<script lang="ts">
	import type { Range } from '@template/ui';
	import { getStats } from '../../api/insights.remote';
	import StatTile from './StatTile.svelte';

	let { range }: { range: Range } = $props();

	const stats = $derived(await getStats(range));
</script>

<div class="tiles">
	<StatTile label="Created" value={String(stats.total)} hint="in range" />
	<StatTile label="Completion" value="{stats.rate}%" hint="{stats.done} done" />
	<StatTile label="Open" value={String(stats.open)} />
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
