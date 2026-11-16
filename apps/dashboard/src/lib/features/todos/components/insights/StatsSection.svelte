<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { createQuery } from '@tanstack/svelte-query';
	import { Issue, Skeleton } from '@template/ui';
	import { stats } from '../../api/todos.query';
	import StatTile from './StatTile.svelte';

	let { range, compare }: { range: Insights.Range; compare?: Insights.Range } = $props();

	const query = createQuery(() => stats(range));
	const prior = createQuery(() => ({ ...stats(compare ?? range), enabled: !!compare }));
	const delta = (value: number, before: number) =>
		before === 0 ? (value === 0 ? 0 : 100) : Math.round(((value - before) / before) * 100);
</script>

{#if query.data}
	{@const data = query.data}
	{@const old = prior.data}
	<div class={['tiles', { stale: query.isPlaceholderData }]}>
		<StatTile
			label="Created"
			value={String(data.total)}
			hint="in range"
			delta={old ? delta(data.total, old.total) : undefined}
		/>
		<StatTile
			label="Completion"
			value="{data.rate}%"
			hint="{data.done} done"
			delta={old ? data.rate - old.rate : undefined}
			unit=" pts"
		/>
		<StatTile
			label="Active"
			value={String(data.active)}
			hint="in flight"
			delta={old ? delta(data.active, old.active) : undefined}
		/>
		<StatTile
			label="Blocked"
			value={String(data.blocked)}
			delta={old ? delta(data.blocked, old.blocked) : undefined}
			tone={data.blocked > 0 ? 'danger' : 'default'}
		/>
		<StatTile
			label="Overdue"
			value={String(data.overdue)}
			hint="all time"
			tone={data.overdue > 0 ? 'danger' : 'default'}
		/>
	</div>
{:else if query.error}
	<Issue>{query.error.message}</Issue>
{:else}
	<Skeleton h="88px" />
{/if}

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75em;
		transition: opacity 140ms ease;
	}

	.stale {
		opacity: 0.55;
	}

	@media (prefers-reduced-motion: reduce) {
		.tiles {
			transition: none;
		}
	}
</style>
