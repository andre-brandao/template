<!-- Current: module tiles on the left, the widget column on the right from 1100px. -->
<script lang="ts">
	import type { Props } from '../../modules';
	import Card from '../Card.svelte';
	import Tiles from '../Tiles.svelte';
	import Panel from '../Panel.svelte';

	let { modules, widgets }: Props = $props();

	const main = $derived(widgets.filter((widget) => widget.wide));
	const side = $derived(widgets.filter((widget) => !widget.wide));
</script>

<div class={['current', { split: side.length > 0 }]}>
	<div class="main">
		<Tiles {modules} />
		{#each main as widget (widget.key)}<Card {widget} />{/each}
	</div>
	<Panel widgets={side} />
</div>

<style>
	.current {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: 2em 2.5em;
	}

	.main {
		display: grid;
		gap: 1em;
		min-width: 0;
	}

	@media (min-width: 1100px) {
		.split {
			grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
		}
	}
</style>
