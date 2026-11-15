<!-- One big number: `column` of the first row, or its first numeric column. -->
<script lang="ts">
	import { Stat } from '@template/ui';
	import { fmt } from '$lib/utils/fmt';
	import { limits, type Block } from '../catalog';
	import { formatter, metric } from '../numbers';
	import Data from './Data.svelte';

	let { props, loading }: Block<'Metric'> = $props();

	const f = fmt();
	const format = $derived(formatter(props.format, f.locale));
</script>

<Stat label={props.label ?? ''}>
	<Data sql={props.sql} limit={limits.Metric} meta={false} {loading}>
		{#snippet children(data)}
			{@const number = metric(data, props.column)}
			{number === undefined ? '—' : format(number)}
		{/snippet}
	</Data>
</Stat>
