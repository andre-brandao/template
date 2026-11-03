<!-- Horizontal HTML bars, one per row; without a numeric column it falls back to a table. -->
<script lang="ts">
	import type { Block } from '../catalog';
	import { bars, formatter } from '../numbers';
	import Data from './Data.svelte';
	import Grid from './Grid.svelte';
	import Titled from './Titled.svelte';

	let { props, loading }: Block<'Chart'> = $props();
</script>

<Titled title={props.title}>
	<Data sql={props.sql} {loading}>
		{#snippet children(data)}
			{@const list = bars(data, props.x, props.y)}
			{#if list}
				{@const format = formatter(props.format)}
				<ul>
					{#each list as row, i (i)}
						<li>
							<span class="label" title={row.label}>{row.label}</span>
							<span class="track"><span class="bar" style:width="{row.width}%"></span></span>
							<span class="value">{format(row.value)}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<Grid {data} />
			{/if}
		{/snippet}
	</Data>
</Titled>

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.8em;
	}

	li {
		display: grid;
		grid-template-columns: minmax(0, 8em) 1fr auto;
		align-items: center;
		gap: 0.5em;
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--muted);
	}

	.track {
		height: 0.8em;
		border-radius: var(--radius);
		background: var(--surface-2);
	}

	.bar {
		display: block;
		height: 100%;
		border-radius: var(--radius);
		background: var(--accent);
	}

	.value {
		font-variant-numeric: tabular-nums;
	}
</style>
