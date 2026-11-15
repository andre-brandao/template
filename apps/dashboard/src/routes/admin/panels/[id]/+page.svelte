<script lang="ts">
	import PanelPage from '$lib/features/agent/pages/PanelPage.svelte';

	let { params } = $props();
</script>

<!-- params empty mid-navigation; without the guard the page queries with `undefined`. -->
{#if params.id}
	<PanelPage id={params.id} />
{/if}
