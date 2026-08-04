<script lang="ts">
	import ProjectPage from '$lib/features/projects/pages/ProjectPage.svelte';

	let { params } = $props();
</script>

<!--
	`params` is `page.params`, which swaps to the *next* route's params the moment a
	navigation (or a hover-preload fork) starts — while async Svelte keeps this page
	mounted until that route resolves. Without the guard the page re-queries with
	`id: undefined`, which the remote function rejects on every attempt.
-->
{#if params.id}
	<ProjectPage id={params.id} />
{/if}
