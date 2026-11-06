<!--
	A json-render panel drawn with the agent's catalog. Takes a spec still streaming in; while
	`loading`, data blocks wait for it to finish before they query.
-->
<script lang="ts">
	import { JsonUIProvider, Renderer } from '@json-render/svelte';
	import { registry } from './registry';
	import { clean } from './spec';

	let { spec, loading = false }: { spec: unknown; loading?: boolean } = $props();

	const tidy = $derived(clean(spec));
</script>

{#if tidy}
	<JsonUIProvider initialState={{}}>
		<Renderer spec={tidy} {registry} {loading} />
	</JsonUIProvider>
{/if}
