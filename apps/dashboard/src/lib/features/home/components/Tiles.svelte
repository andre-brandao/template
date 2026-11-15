<!-- The module grid; which tiles, in what order, comes from modules.ts. -->
<script lang="ts">
	import type { Module } from '../modules';
	import Tile from './Tile.svelte';

	let { modules }: { modules: Module[] } = $props();
</script>

<nav aria-label="Modules">
	{#each modules as module (module.href)}
		<Tile {module} />
	{/each}
</nav>

<style>
	/* One-line rows that wrap into columns, so a narrower page adds rows, never height. */
	nav {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(14rem, 100%), 1fr));
		gap: 0.5em;
	}
</style>
