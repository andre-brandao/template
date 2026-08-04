<script lang="ts">
	import type { Insights } from '@template/core/todo';
	import { getLoad } from '../../api/insights.remote';
	import { color } from '../../status';
	import Section from './Section.svelte';

	let { range }: { range: Insights.Range } = $props();

	const load = $derived(await getLoad(range));

	// Only the buckets that mean work-in-hand; done is shown as the tail of the bar.
	const parts = ['active', 'blocked', 'planned', 'done'] as const;
</script>

<Section title="By assignee">
	{#if load.rows.length === 0}
		<p class="empty">No tasks in this range</p>
	{:else}
		<div class="rows">
			{#each load.rows as row (row.name)}
				<span class="name">{row.name}</span>
				<span class="track">
					{#each parts as part (part)}
						{#if row[part] > 0}
							<span
								class="seg"
								style:width="{(row[part] / load.max) * 100}%"
								style:background={color(part)}
								title="{row[part]} {part}"
							></span>
						{/if}
					{/each}
				</span>
				<span class="count">{row.total}</span>
			{/each}
		</div>
	{/if}
</Section>

<style>
	.rows {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.6em 0.9em;
	}

	.name {
		font-size: 0.85em;
		color: var(--muted);
		max-width: 12em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.track {
		display: flex;
		height: 1.4em;
		background: var(--surface-2);
		border-radius: 4px;
		overflow: hidden;
	}

	.seg {
		display: block;
		height: 100%;
		transition: width 0.3s ease;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--muted);
		min-width: 2ch;
		text-align: right;
	}

	.empty {
		color: var(--dim);
		margin: 0;
	}
</style>
