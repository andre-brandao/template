<script module lang="ts">
	import type { Story } from '../story';
	import Field from '../field/Field.svelte';
	import Pager from './Pager.svelte';

	export const story: Story = {
		title: 'Pager',
		blurb: 'Renders nothing when there is only one page — the hiding is the point of the component.',
		of: Pager
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { Pager } from '@template/ui';

	let page = $state(1);
	let size = $state(20);
	let total = $state(137);
</script>

<div class="knobs">
	<Field label="pageSize">
		<input type="number" min="1" bind:value={size} />
	</Field>
	<Field label="total">
		<input type="number" min="0" bind:value={total} />
	</Field>
</div>

<Pager of={{ page, pageSize: size, total }} onchange={(next) => (page = next)} label="todos" />

<p class="note">Set total below pageSize and the control disappears.</p>

<style>
	.knobs {
		display: flex;
		gap: 1em;
		margin-bottom: 1em;
	}

	.knobs input {
		width: 7em;
		font: inherit;
		padding: 0.4em 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	.note {
		margin-top: 1em;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
