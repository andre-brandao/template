<script lang="ts">
	import { z } from 'zod';
	import { query } from '$lib/params';
	import { RangePicker, last, valid, type Range } from '@template/ui';
	import { debounce } from '$lib/debounce';
	import StatsSection from '../components/insights/StatsSection.svelte';
	import ActivitySection from '../components/insights/ActivitySection.svelte';
	import DueSection from '../components/insights/DueSection.svelte';
	import StatusSection from '../components/insights/StatusSection.svelte';
	import Skeleton from '../components/insights/Skeleton.svelte';

	const fallback = last(30);
	const params = query(
		z.object({
			start: z.iso.date().default(fallback.start),
			end: z.iso.date().default(fallback.end)
		})
	);
	// valid() rejects out-of-order or over-long ranges, so garbage params collapse to the fallback.
	const range = $derived(
		 valid(params) ? params : fallback
	);
	const commit = debounce(params.update, 250);
</script>

<h1>Insights</h1>

<div class="toolbar">
	<RangePicker {range} onchange={commit} />
	{#if $effect.pending()}<span class="updating">updating…</span>{/if}
</div>

<div class="sections" class:stale={$effect.pending()}>
	<svelte:boundary>
		<StatsSection {range} />
		{#snippet pending()}<Skeleton height="88px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<ActivitySection {range} />
		{#snippet pending()}<Skeleton height="382px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<DueSection />
		{#snippet pending()}<Skeleton height="276px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<StatusSection {range} />
		{#snippet pending()}<Skeleton height="264px" />{/snippet}
	</svelte:boundary>
</div>

<style>
	h1 {
		margin: 0 0 0.75em;
		font-size: 1.4em;
	}

	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
		margin-bottom: 1.25em;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 1.25em;
		transition: opacity 0.15s ease;
	}

	.sections.stale {
		opacity: 0.55;
	}

	.updating {
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--dim);
	}
</style>
