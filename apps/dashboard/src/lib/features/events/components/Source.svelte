<script lang="ts">
	import { getSource } from '../api/sources.remote';

	// Resolves a `{source, sourceID}` ref to its display name. Self-contained: the
	// await suspends its own boundary, so hosting pages don't block on the lookup.
	let {
		source,
		sourceID,
		fallback
	}: { source?: string; sourceID?: string; fallback: string } = $props();
</script>

<svelte:boundary>
	{#if source && sourceID}
		{(await getSource({ source, sourceID }))?.name ?? fallback}
	{:else}
		{fallback}
	{/if}
	{#snippet pending()}{fallback}{/snippet}
</svelte:boundary>
