<script lang="ts">
	import { z } from 'zod';
	import { query } from '$lib/utils/params';
	import Header from '$lib/components/Header.svelte';
	import { RangePicker, last, valid, type Range } from '@template/ui';
	import { debounce } from '$lib/utils/debounce';
	import StatsSection from '../components/insights/StatsSection.svelte';
	import ActivitySection from '../components/insights/ActivitySection.svelte';
	import CalendarSection from '../components/insights/CalendarSection.svelte';
	import DueSection from '../components/insights/DueSection.svelte';
	import StatusSection from '../components/insights/StatusSection.svelte';
	import LoadSection from '../components/insights/LoadSection.svelte';
	import Skeleton from '../components/insights/Skeleton.svelte';
	import { getSource } from '$lib/features/events/api/sources.remote';

	let { source, sourceID }: { source?: string; sourceID?: string } = $props();

	const fallback = last(30);
	const params = query(
		z.object({
			start: z.iso.date().default(fallback.start),
			end: z.iso.date().default(fallback.end)
		})
	);
	const scope = $derived({ source, sourceID });
	// valid() rejects out-of-order or over-long ranges, so garbage params collapse to the fallback.
	const picked = $derived(valid(params) ? { start: params.start, end: params.end } : fallback);
	const range = $derived({ ...picked, ...scope });
	const commit = debounce(params.update, 250);

	const src = $derived(source && sourceID ? await getSource({ source, sourceID }) : undefined);
	const title = $derived(src?.name ?? 'Insights');
</script>

<Header {title} />

<div class="toolbar">
	<RangePicker range={picked} onchange={commit} />
	{#if $effect.pending()}<span class="updating">updating…</span>{/if}
</div>

<div class="sections" class:stale={$effect.pending()}>
	<div class="span">
		<svelte:boundary>
			<StatsSection {range} />
			{#snippet pending()}<Skeleton height="88px" />{/snippet}
		</svelte:boundary>
	</div>

	<svelte:boundary>
		<ActivitySection {range} />
		{#snippet pending()}<Skeleton height="382px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<StatusSection {range} />
		{#snippet pending()}<Skeleton height="382px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<CalendarSection {range} />
		{#snippet pending()}<Skeleton height="276px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<DueSection {scope} />
		{#snippet pending()}<Skeleton height="276px" />{/snippet}
	</svelte:boundary>

	<div class="span">
		<svelte:boundary>
			<LoadSection {range} />
			{#snippet pending()}<Skeleton height="264px" />{/snippet}
		</svelte:boundary>
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
		margin-bottom: 1.25em;
	}

	.sections {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25em;
		transition: opacity 0.15s ease;
	}

	/* Two-up on desktop, columns in golden ratio: the busy chart gets the major share. */
	@media (min-width: 1100px) {
		.sections {
			grid-template-columns: 1.618fr 1fr;
		}

		.span {
			grid-column: 1 / -1;
		}
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
