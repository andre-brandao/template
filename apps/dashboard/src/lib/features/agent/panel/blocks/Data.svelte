<!--
	A data block's frame: a placeholder while the spec streams or the rows load, the block
	once they arrive, and the row count under it. A failure stays in here with a retry.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Issue, Skeleton } from '@template/ui';
	import { rows, type Rows } from '../../api/panel.query';

	let {
		sql,
		limit,
		loading = false,
		meta = true,
		children
	}: {
		sql: string | undefined;
		/** The rows the block draws; nothing past it is fetched. */
		limit: number;
		loading?: boolean;
		/** The row count and timing under the block. */
		meta?: boolean;
		children: Snippet<[Rows]>;
	} = $props();

	const query = createQuery(() => ({
		...rows(sql ?? '', limit),
		enabled: browser && !loading && !!sql
	}));
</script>

{#if query.isSuccess}
	{#if query.data.rows.length}
		{@render children(query.data)}
	{:else}
		<p class="empty">No data</p>
	{/if}
	{#if meta}
		<span class="hint">
			{query.data.rows.length}{query.data.truncated ? '+' : ''}
			{query.data.rows.length === 1 ? 'row' : 'rows'} · {query.data.ms} ms
		</span>
	{/if}
{:else if query.isError}
	<Issue>{query.error.message}</Issue>
	<Button variant="ghost" pending={query.isFetching} onclick={() => query.refetch()}>Retry</Button>
{:else}
	<Skeleton h="4em" />
{/if}

<style>
	.empty {
		margin: 0;
		padding: 1em;
		border: 1px dashed var(--border);
		border-radius: var(--radius);
		color: var(--dim);
		font-size: 0.8em;
		text-align: center;
	}

	.hint {
		color: var(--dim);
		font-size: 0.75em;
		font-variant-numeric: tabular-nums;
	}
</style>
