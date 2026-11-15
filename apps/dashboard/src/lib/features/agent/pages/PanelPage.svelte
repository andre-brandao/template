<!-- One saved panel, its blocks querying as the viewer. -->
<script lang="ts">
	import * as Header from '$lib/components/header';
	import { fmt } from '$lib/utils/fmt';
	import { getPanel } from '../api/panel.remote';
	import Render from '../panel/Render.svelte';

	let { id }: { id: string } = $props();

	const panel = $derived(await getPanel(id));
	const f = fmt();
</script>

{#snippet back()}<a href="/admin/panels">Panels</a>{/snippet}

<Header.Root title={panel.title} eyebrow={back}>
	<Header.Item label="Author">{panel.author || 'Unknown'}</Header.Item>
	<Header.Item label="Updated">
		<span title={f.stamp(panel.timeUpdated)}>{f.ago(panel.timeUpdated)}</span>
	</Header.Item>
</Header.Root>

<Render spec={panel.spec} />
