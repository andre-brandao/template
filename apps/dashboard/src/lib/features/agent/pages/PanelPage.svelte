<!-- One saved panel, its blocks querying as the viewer. -->
<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { getPanel } from '../api/panel.remote';
	import Render from '../panel/Render.svelte';

	let { id }: { id: string } = $props();

	const panel = $derived(await getPanel(id));
</script>

<Header title={panel.title}>
	Saved by {panel.author || 'unknown'}.
</Header>

<Render spec={panel.spec} />
