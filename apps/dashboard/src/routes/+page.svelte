<script lang="ts">
	import Topbar from '#lib/components/layout/Topbar.svelte';
	import Hero from '#lib/features/home/components/Hero.svelte';
	import { brand } from '#lib/brand.ts';
</script>

<svelte:head><title>{brand.name}</title></svelte:head>

<!-- The public page, outside the app shell, so it carries its own header. -->
<Topbar user={null} />

<main><Hero /></main>

<style>
	/* Left-aligned: the rule's left edge is the page's spine. */
	main {
		width: 100%;
		max-width: 46em;
		margin: 12vh auto 0;
		padding: 0 1.25em 4em;
	}

	@media (max-width: 640px) {
		main {
			margin-top: 7vh;
		}
	}
</style>
