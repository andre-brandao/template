<script lang="ts">
	import { z } from 'zod';
	import { query } from '$lib/utils/params';
	import * as Header from '$lib/components/header';
	import { useIsFetching } from '@tanstack/svelte-query';
	import { RangePicker, Status, last, valid } from '@template/ui';
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
	// Every insight carries the Todo tag; the dot pulses while a new range loads.
	const fetching = useIsFetching({ queryKey: [{ tags: ['Todo'] }] });
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
		{#if fetching.current}
			<Header.Group end><Status state="pending" /></Header.Group>
		{/if}
	{/snippet}
</Header.Root>

<div class="sections">
	<div class="span"><StatsSection {range} /></div>
	<ActivitySection {range} />
	<StatusSection {range} />
	<CalendarSection {range} />
	<DueSection {scope} />
	<div class="span"><LoadSection {range} /></div>
</div>

<style>
	.sections {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25em;
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
</style>
