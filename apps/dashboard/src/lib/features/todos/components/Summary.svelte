<!-- A project's todo facts for its header; the same cached queries Stages and Recent read. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as Header from '$lib/components/header';
	import { day, fmt, today } from '$lib/utils/fmt';
	import { list, stages } from '../api/todos.query';

	let { scope }: { scope: { source: string; sourceID: string } } = $props();

	const f = fmt();
	const todos = createQuery(() => list(scope));
	const spans = createQuery(() => stages(scope));
	const now = $derived(today(f.zone));

	const stage = $derived(
		spans.data?.find(
			(one) =>
				one.start && one.end && day(one.start, f.zone) <= now && now <= day(one.end, f.zone)
		) ?? spans.data?.find((one) => one.done < one.total)
	);
</script>

{#if todos.data}
	{@const rows = todos.data.data}
	<Header.Item label="Todos">
		{rows.length >= 100 ? '100+' : rows.length}
		<span class="muted">{rows.filter((one) => one.status !== 'done').length} open</span>
	</Header.Item>
{/if}
{#if stage}
	<Header.Item label="Stage">
		{stage.name}
		<span class="muted">{stage.done}/{stage.total} done</span>
	</Header.Item>
{/if}

<style>
	.muted {
		font-weight: 400;
		color: var(--muted);
	}
</style>
