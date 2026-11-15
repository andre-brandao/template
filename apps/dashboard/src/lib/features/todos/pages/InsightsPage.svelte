<script lang="ts">
	import { z } from 'zod';
	import { query } from '$lib/utils/params';
	import * as Header from '$lib/components/header';
	import { RangePicker, Skeleton, last, valid, type Range } from '@template/ui';
	import { debounce } from '$lib/utils/debounce';
	import StatsSection from '../components/insights/StatsSection.svelte';
	import ActivitySection from '../components/insights/ActivitySection.svelte';
	import CalendarSection from '../components/insights/CalendarSection.svelte';
	import DueSection from '../components/insights/DueSection.svelte';
	import StatusSection from '../components/insights/StatusSection.svelte';
	import LoadSection from '../components/insights/LoadSection.svelte';
	import Source from '$lib/features/events/components/Source.svelte';

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
</script>

<!-- Scoped to a project, the project rides above the title as the way back. -->
{#snippet parent()}
	<a href="/projects/{sourceID}"><Source {source} {sourceID} fallback="Project" /></a>
{/snippet}

<Header.Root title="Insights" eyebrow={source && sourceID ? parent : undefined}>
	{#snippet strip()}
		<Header.Group label="Period">
			<RangePicker range={picked} onchange={commit} />
		</Header.Group>
		{#if $effect.pending()}
			<Header.Group end><span class="updating">updating…</span></Header.Group>
		{/if}
	{/snippet}
</Header.Root>

<div class={['sections', { stale: $effect.pending() }]}>
	<div class="span">
		<svelte:boundary>
			<StatsSection {range} />
			{#snippet pending()}<Skeleton h="88px" />{/snippet}
		</svelte:boundary>
	</div>

	<svelte:boundary>
		<ActivitySection {range} />
		{#snippet pending()}<Skeleton h="382px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<StatusSection {range} />
		{#snippet pending()}<Skeleton h="382px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<CalendarSection {range} />
		{#snippet pending()}<Skeleton h="276px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<DueSection {scope} />
		{#snippet pending()}<Skeleton h="276px" />{/snippet}
	</svelte:boundary>

	<div class="span">
		<svelte:boundary>
			<LoadSection {range} />
			{#snippet pending()}<Skeleton h="264px" />{/snippet}
		</svelte:boundary>
	</div>
</div>

<style>
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
