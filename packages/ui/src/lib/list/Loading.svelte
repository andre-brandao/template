<script lang="ts">
	import Skeleton from '../skeleton/Skeleton.svelte';
	import List from './List.svelte';

	// Row-height placeholders inside the real list frame, so the data lands without a jump.
	let { rows = 3, boxed = false }: { rows?: number; boxed?: boolean } = $props();

	const widths = ['42%', '58%', '34%'];
	const lines = $derived(Array.from({ length: rows }, (_, i) => i));
</script>

<List label="Loading" {boxed}>
	{#each lines as i (i)}
		<li class="row" aria-busy="true">
			<span class="bar" style:width={widths[i % widths.length]}><Skeleton h="0.9em" /></span>
			<span class="bar" style:width="4em"><Skeleton h="0.8em" /></span>
		</li>
	{/each}
</List>

<style>
	/* The same box as `List.Row`: height, padding and rule. */
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
		min-height: 3em;
		padding: 0.35em 2.5em 0.35em 0.7em;
		border-bottom: 1px solid var(--border, #e6e5e1);
	}

	.row:last-child {
		border-bottom-color: transparent;
	}

	.bar {
		display: flex;
	}
</style>
