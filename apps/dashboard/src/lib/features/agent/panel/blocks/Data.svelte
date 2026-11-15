<!--
	A data block's frame: a placeholder while the spec streams or the rows load, the block
	once they arrive, and the row count under it. A failure stays in here with a retry.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Issue, Skeleton } from '@template/ui';
	import { failure } from '../../failure';
	import { fetchRows, type Result } from '../rows';

	let {
		sql,
		loading = false,
		children
	}: { sql: string | undefined; loading?: boolean; children: Snippet<[Result]> } = $props();

	const count = new Intl.NumberFormat();
</script>

{#if loading || !sql}
	<Skeleton h="4em" />
{:else}
	<svelte:boundary>
		{@const data = await fetchRows(sql)}
		{#if data.rows.length}
			{@render children(data)}
		{:else}
			<p class="empty">No data</p>
		{/if}
		<span class="hint">
			{count.format(data.rows.length)}{data.truncated ? '+' : ''}
			{data.rows.length === 1 ? 'row' : 'rows'} · {count.format(data.ms)} ms
		</span>
		{#snippet pending()}
			<Skeleton h="4em" />
		{/snippet}
		{#snippet failed(err, reset)}
			<Issue>{failure(err)}</Issue>
			<Button variant="ghost" onclick={reset}>Retry</Button>
		{/snippet}
	</svelte:boundary>
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
