<script lang="ts">
	import Topbar from '#lib/components/layout/Topbar.svelte';
	import Hero from '#lib/features/home/components/Hero.svelte';
	import { brand } from '#lib/brand.ts';
	import ThemeToggle from '#lib/features/settings/components/ThemeToggle.svelte';
</script>

<svelte:head><title>{brand.name}</title></svelte:head>

<!-- The public page, outside the app shell, so it carries its own header. -->
<Topbar user={null}>
	{#snippet account()}<ThemeToggle />{/snippet}
</Topbar>

<main><Hero /></main>

<style>
	main {
		width: 100%;
		max-width: 40em;
		margin: 12vh auto 0;
		padding: 0 1.25em 4em;
	}

	@media (max-width: 640px) {
		main {
			margin-top: 7vh;
		}
	}
</style>
