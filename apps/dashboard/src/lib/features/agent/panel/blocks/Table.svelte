<!-- Every column of the result, for lists. -->
<script lang="ts">
	import type { Block } from '../catalog';
	import Data from './Data.svelte';
	import Grid from './Grid.svelte';
	import Titled from './Titled.svelte';

	let { props, loading }: Block<'Table'> = $props();
</script>

<Titled title={props.title}>
	<Data sql={props.sql} {loading}>
		{#snippet children(data)}
			<Grid {data} />
		{/snippet}
	</Data>
</Titled>
