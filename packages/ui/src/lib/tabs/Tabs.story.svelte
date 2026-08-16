<script module lang="ts">
	import type { Story } from '../story';
	import Root from './Tabs.svelte';

	export const story: Story = {
		title: 'Tabs',
		blurb:
			'A one-of-many switch. `Tabs.Item` renders a button, or an anchor when given `href` — a view that lives in the URL stays linkable and survives a reload, so pick the one that matches where the state is kept.',
		of: Root
	};
</script>

<script lang="ts">
	// import { Tabs } from '@template/ui';
	import * as Tabs from './index';

	let view = $state('board');
</script>

<Tabs.Root>
	{#each ['table', 'board', 'timeline'] as one (one)}
		<Tabs.Item active={view === one} style="text-transform: capitalize" onclick={() => (view = one)}>
			{one}
		</Tabs.Item>
	{/each}
</Tabs.Root>
