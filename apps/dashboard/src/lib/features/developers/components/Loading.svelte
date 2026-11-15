<script lang="ts">
	import { Skeleton } from '@template/ui';
	import List from './List.svelte';

	// Row-height placeholders, so the real list lands without a jump.
	let { rows = 3 }: { rows?: number } = $props();
</script>

<List>
	{#each { length: rows }, i (i)}
		<li>
			{#each ['9em', '12em', '6em'] as w (w)}
				<span style:width={w}><Skeleton h="0.9em" /></span>
			{/each}
		</li>
	{/each}
</List>

<style>
	li {
		display: flex;
		align-items: center;
		gap: 0.9em;
		min-height: 2.75em;
		padding: 0.3em 0.8em;
		border-bottom: 1px solid var(--border);
	}

	li:last-child {
		border-bottom: 0;
	}
</style>
