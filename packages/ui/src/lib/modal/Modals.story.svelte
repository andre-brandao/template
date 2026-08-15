<script module lang="ts">
	import type { Story } from '../story';
	import Modals from './Modals.svelte';
	import Button from '../input/Button.svelte';
	import { modal, type Ask } from './modal.svelte';
	import Pager from '../pager/Pager.svelte';

	export const story: Story = {
		title: 'Modals',
		blurb:
			'A viewport singleton with no props — the app mounts one in its root layout and everything else calls `modal`. One slot: opening over a live modal dismisses it.',
		of: Modals
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { Modals, Button, Pager, modal, type Ask } from '@template/ui';

	let said = $state('—');

	const ask = async (opts: Ask) =>
		(said = (await modal.confirm(opts)) ? 'confirmed' : 'dismissed');
</script>

{#snippet plain()}
	<b>staging-api</b> stops receiving deliveries at once. This cannot be undone.
{/snippet}

<div class="row">
	<Button
		variant="danger"
		onclick={() => ask({ title: 'Delete webhook', action: 'Delete webhook', body: plain })}
	>
		confirm
	</Button>
	<Button
		variant="danger"
		onclick={() =>
			ask({
				title: 'Delete project',
				action: 'Delete project',
				body: plain,
				verify: 'staging-api'
			})}
	>
		confirm with verify
	</Button>
	<Button
		variant="secondary"
		onclick={async () => (said = String(await modal(Pager, { page: 1, pages: 3 })))}
	>
		arbitrary component
	</Button>
</div>

<p class="note">
	Last result: <code>{said}</code>. Escape and the backdrop both dismiss — a confirm resolves
	<code>false</code>, anything else <code>undefined</code>. The arbitrary component is handed a
	<code>close</code> prop to resolve with; Pager ignores it, so only a dismissal ends it.
</p>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6em;
		margin-bottom: 0.8em;
	}

	.note {
		margin-top: 0.6em;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
