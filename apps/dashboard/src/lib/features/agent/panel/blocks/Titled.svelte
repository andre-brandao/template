<!-- A data block under its optional title. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title?: string; children: Snippet } = $props();
</script>

<div class="block">
	{#if title}<h5>{title}</h5>{/if}
	{@render children()}
</div>

<style>
	.block {
		display: flex;
		flex-direction: column;
		gap: 0.45em;
		min-width: 0;
	}

	h5 {
		margin: 0;
		font-size: 0.85em;
		font-weight: 600;
	}
</style>
