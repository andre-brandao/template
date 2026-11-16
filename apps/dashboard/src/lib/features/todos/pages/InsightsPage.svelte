<script lang="ts">
	import { query } from '#lib/utils/params.ts';
	import * as Header from '#lib/components/header/index.ts';
	import { useIsFetching } from '@tanstack/svelte-query';
	import { RangePicker, Status, today } from '@template/ui';
	import { period, span } from '../filter';
	import { debounce } from '#lib/utils/debounce.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import StatsSection from '../components/insights/StatsSection.svelte';
	import ActivitySection from '../components/insights/ActivitySection.svelte';
	import CalendarSection from '../components/insights/CalendarSection.svelte';
	import DueSection from '../components/insights/DueSection.svelte';
	import StatusSection from '../components/insights/StatusSection.svelte';
	import LoadSection from '../components/insights/LoadSection.svelte';
	import Source from '#lib/features/events/components/Source.svelte';

	let { source, sourceID }: { source?: string; sourceID?: string } = $props();

	const f = fmt();
	// The stored zone's today, so the server render and the browser agree on the range.
	const now = today(f.zone);
	const params = query(period(now));
	const scope = $derived({ source, sourceID });
	const picked = $derived(span(params, now));
	const range = $derived({ ...picked, ...scope });
	const commit = debounce(params.update, 250);
	// Every insight carries the Insights tag; the dot pulses while a new range loads.
	const fetching = useIsFetching({ queryKey: [{ tags: ['Insights'] }] });
</script>

<!-- Scoped to a project, the project rides above the title as the way back. -->
{#snippet parent()}
	<a href="/projects/{sourceID}"><Source {source} {sourceID} fallback="Project" /></a>
{/snippet}

<Header.Root title="Insights" eyebrow={source && sourceID ? parent : undefined}>
	{#snippet strip()}
		<Header.Group label="Period">
			<!-- The picker drafts locally; 366 is core's Insights.Range cap. -->
			<RangePicker
				range={picked}
				presets={[7, 30, 90, 365]}
				max={now}
				maxSpan={366}
				onchange={commit}
			/>
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
