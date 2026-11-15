<script lang="ts">
	import { onlineManager, type QueryClient } from '@tanstack/svelte-query';
	import { TanstackQueryDevtoolsPanel } from '@tanstack/query-devtools';

	// The devtools shell passes `theme`; `client` comes in as a plugin prop.
	let { client, theme }: { client: QueryClient; theme?: 'light' | 'dark' } = $props();
</script>

<div
	{@attach (el) => {
		const panel = new TanstackQueryDevtoolsPanel({
			client,
			theme,
			queryFlavor: 'Svelte Query',
			version: '5',
			onlineManager
		});
		panel.mount(el);
		return () => panel.unmount();
	}}
></div>

<style>
	div {
		height: 100%;
	}
</style>
