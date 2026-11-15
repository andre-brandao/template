<!-- The signed-in home: module tiles, and from 1100px the route's widgets in a column beside them. -->
<script lang="ts">
	import { user } from '$lib/utils/context';
	import { modules, type Widget } from '../modules';
	import Tiles from '../components/Tiles.svelte';
	import Panel from '../components/Panel.svelte';

	let { name, widgets }: { name: string; widgets: Widget[] } = $props();

	const me = user();
	const shown = $derived(modules.filter((one) => !one.grants || me.can(one.grants)));
</script>

<div class="home">
	<h1>Welcome back, {name}.</h1>
	<div class={['grid', { side: widgets.length > 0 }]}>
		<Tiles modules={shown} />
		<Panel {widgets} />
	</div>
</div>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
	}

	.grid {
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
