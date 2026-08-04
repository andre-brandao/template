<script lang="ts">
	import { z } from 'zod';
	import { query } from '$lib/utils/params';
	import { RangePicker, last, valid, type Range } from '@template/ui';
	import { debounce } from '$lib/utils/debounce';
	import StatsSection from '../components/insights/StatsSection.svelte';
	import ActivitySection from '../components/insights/ActivitySection.svelte';
	import CalendarSection from '../components/insights/CalendarSection.svelte';
	import DueSection from '../components/insights/DueSection.svelte';
	import StatusSection from '../components/insights/StatusSection.svelte';
	import LoadSection from '../components/insights/LoadSection.svelte';
	import Skeleton from '../components/insights/Skeleton.svelte';
	import { getProject } from '$lib/features/projects/api/projects.remote';

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

	const project = $derived(
		source === 'project' && sourceID ? await getProject(sourceID) : undefined
	);
	const title = $derived(project?.name ?? 'Insights');
</script>

<h1>{title}</h1>

<div class="toolbar">
	<RangePicker range={picked} onchange={commit} />
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
		<CalendarSection {range} />
		{#snippet pending()}<Skeleton height="220px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<DueSection {scope} />
		{#snippet pending()}<Skeleton height="276px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<StatusSection {range} />
		{#snippet pending()}<Skeleton height="264px" />{/snippet}
	</svelte:boundary>

	<svelte:boundary>
		<LoadSection {range} />
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
