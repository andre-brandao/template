<!-- Current: module tiles on the left, the widget column on the right from 1100px. -->
<script lang="ts">
	import type { Props } from '../../modules';
	import Tiles from '../Tiles.svelte';
	import Panel from '../Panel.svelte';

	let { modules, widgets }: Props = $props();
</script>

<div class={['current', { side: widgets.length > 0 }]}>
	<Tiles {modules} />
	<Panel {widgets} />
</div>

<style>
	.current {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: 2em 2.5em;
	}

	@media (min-width: 1100px) {
		.side {
			grid-template-columns: minmax(0, 1fr) minmax(0, 22rem);
		}
	}
</style>
