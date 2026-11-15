<!-- A project's todo facts for its header; the same cached queries Stages and Recent read. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as Header from '$lib/components/header';
	import { list, stages } from '../api/todos.query';

	let { scope }: { scope: { source: string; sourceID: string } } = $props();

	const todos = createQuery(() => list(scope));
	const spans = createQuery(() => stages(scope));
	const today = new Date().toISOString().slice(0, 10);

	const stage = $derived(
		spans.data?.find(
			(one) => one.start && one.end && one.start.slice(0, 10) <= today && today <= one.end.slice(0, 10)
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
