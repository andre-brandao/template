<script module lang="ts">
	export type View = 'list' | 'board' | 'table' | 'timeline' | 'calendar';
</script>

<script lang="ts">
	import { Tabs } from '@template/ui';

	let { view = 'table', onchange }: { view?: View; onchange: (view: View) => void } = $props();
</script>

<Tabs.Root>
	{#each ['table', 'board', 'timeline', 'calendar', 'list'] as const as v (v)}
		<Tabs.Item active={view === v} style="text-transform: capitalize" onclick={() => onchange(v)}>
			{v}
		</Tabs.Item>
	{/each}
</Tabs.Root>
