<script lang="ts">
	import InspectPage from '#lib/features/workspaces/pages/InspectPage.svelte';

	let { params } = $props();
</script>

<!-- params empty mid-navigation; without the guard the page queries with `undefined`. -->
{#if params.slug}
	<InspectPage slug={params.slug} />
{/if}
