<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { createQuery } from '@tanstack/svelte-query';
	import { Issue, Skeleton } from '@template/ui';
	import { stats } from '../../api/todos.query';
	import StatTile from './StatTile.svelte';

	let { range }: { range: Insights.Range } = $props();

	const query = createQuery(() => stats(range));
</script>

{#if query.data}
	{@const data = query.data}
	<div class={['tiles', { stale: query.isPlaceholderData }]}>
		<StatTile label="Created" value={String(data.total)} hint="in range" />
		<StatTile label="Completion" value="{data.rate}%" hint="{data.done} done" />
		<StatTile label="Active" value={String(data.active)} hint="in flight" />
		<StatTile
			label="Blocked"
			value={String(data.blocked)}
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
