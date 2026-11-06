<!-- One big number: `column` of the first row, or its first numeric column. -->
<script lang="ts">
	import type { Block } from '../catalog';
	import { formatter, metric } from '../numbers';
	import Data from './Data.svelte';

	let { props, loading }: Block<'Metric'> = $props();

	const format = $derived(formatter(props.format));
</script>

<div class="metric">
	<span class="label">{props.label ?? ''}</span>
	<Data sql={props.sql} {loading}>
		{#snippet children(data)}
			{@const number = metric(data, props.column)}
			<span class="value">{number === undefined ? '—' : format(number)}</span>
		{/snippet}
	</Data>
</div>

<style>
	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		min-width: 0;
		padding: 0.6em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.label {
		color: var(--muted);
		font-size: 0.81em;
		overflow-wrap: anywhere;
	}

	.value {
		font-size: 1.6em;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1.1;
	}
</style>
