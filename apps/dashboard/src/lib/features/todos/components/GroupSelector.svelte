<!-- How the board and timeline split their rows; a `Header.Group` for the filter strip. -->
<script lang="ts">
	import { Menu } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import type { By } from '../group';
	import Pick from './Pick.svelte';

	let { by = 'status', onchange }: { by?: By; onchange: (by: By) => void } = $props();

	// Stage takes T, since S is status.
	const options = [
		{ value: 'status', label: 'Status', letter: 'S' },
		{ value: 'stage', label: 'Stage', letter: 'T' },
		{ value: 'assignee', label: 'Assignee', letter: 'A' }
	] as const;
</script>

<Header.Group label="Group">
	<Pick label="Group by" text={options.find((one) => one.value === by)?.label ?? 'Status'}>
		{#each options as one (one.value)}
			<Menu.Item
				shortcut={one.letter}
				disabled={one.value === by}
				onselect={() => onchange(one.value)}
			>
				{one.label}
			</Menu.Item>
		{/each}
	</Pick>
</Header.Group>
