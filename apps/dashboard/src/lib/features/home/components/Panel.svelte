<!-- The widget column: one column from 1100px, a two-up grid below, a stack on phones. -->
<script lang="ts">
	import type { Widget } from '../modules';
	import Card from './Card.svelte';

	let { widgets }: { widgets: Widget[] } = $props();
</script>

{#if widgets.length}
	<aside>
		{#each widgets as widget (widget.key)}
			<Card {widget} />
		{/each}
	</aside>
{/if}

<style>
	aside {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1em;
	}

	@media (min-width: 700px) {
		aside {
			grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		}
	}

	@media (min-width: 1100px) {
		aside {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
