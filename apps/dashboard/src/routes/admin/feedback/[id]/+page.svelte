<script lang="ts">
	import IssuePage from '$lib/features/feedback/pages/IssuePage.svelte';

	let { params } = $props();
</script>

<!-- Guarded: params are empty mid-navigation. -->
{#if params.id}
	<IssuePage id={Number(params.id)} />
{/if}
