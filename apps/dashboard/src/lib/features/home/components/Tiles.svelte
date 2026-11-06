<!-- The module grid. Which tiles, in what order, comes from `page` in modules.ts. -->
<script lang="ts">
	import type { Module } from '../modules';
	import Tile from './Tile.svelte';

	let { modules }: { modules: Module[] } = $props();
</script>

<nav aria-label="Modules">
	{#each modules as module (module.key)}
		<Tile {module} />
	{/each}
</nav>

<style>
	nav {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.75em;
	}

	@media (min-width: 480px) {
		nav {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 700px) {
		nav {
			grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		}
	}
</style>
