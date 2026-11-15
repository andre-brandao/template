<script module lang="ts">
	import type { Story } from '../story';
	import Status from './Status.svelte';

	export const story: Story = {
		title: 'Status',
		blurb:
			'A save-state dot: `pending` pulses, `saved` flashes and fades, `failed` stays red with the message on hover. No visible text.',
		of: Status
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { Status } from '@template/ui';
</script>

<p class="row">
	<span>Pending <Status state="pending" /></span>
	<span>Saved <Status state="saved" /></span>
	<span>Failed <Status state="failed" message="Name is taken" /></span>
</p>

<style>
	.row {
		display: flex;
		gap: 2em;
		color: var(--muted);
	}
</style>
