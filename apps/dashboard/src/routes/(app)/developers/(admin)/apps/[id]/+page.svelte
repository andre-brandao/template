<script lang="ts">
	import AppPage from '$lib/features/developers/pages/AppPage.svelte';

	let { params } = $props();
</script>

<!-- `params` swaps to the next route's mid-navigation; the guard keeps `id` defined. -->
{#if params.id}
	<AppPage id={params.id} />
{/if}
