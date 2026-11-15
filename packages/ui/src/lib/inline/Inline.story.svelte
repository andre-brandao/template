<script module lang="ts">
	import type { Story } from '../story';
	import Inline from './Inline.svelte';

	export const story: Story = {
		title: 'Inline',
		blurb:
			'Click-to-edit text. Click, Tab in, or press Enter to edit. Enter or blur saves through `onsave`, and Escape cancels. The new value shows right away; if `onsave` returns a promise a spinner shows until it settles, and a rejection puts the old text back. With `multiline`, Enter adds a line and ⌘/Ctrl+Enter saves.',
		of: Inline
	};

	const wait = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
</script>

<script lang="ts">
	// import { Inline } from '@template/ui';

	let title = $state('Ship the onboarding checklist');
	let notes = $state('First line\nSecond line');
	let saves = $state(0);
</script>

<div class="rows">
	<div class="row">
		<span class="key">Title</span>
		<Inline
			label="Title"
			value={title}
			onsave={async (next) => {
				await wait(600);
				title = next;
				saves++;
			}}
		/>
	</div>
	<div class="row">
		<span class="key">Always fails</span>
		<Inline
			label="Failing field"
			value="Edit me, I revert"
			onsave={async () => {
				await wait(600);
				throw new Error('nope');
			}}
		/>
	</div>
	<div class="row">
		<span class="key">Notes</span>
		<Inline label="Notes" multiline value={notes} onsave={(next) => (notes = next)} />
	</div>
	<div class="row">
		<span class="key">Empty</span>
		<Inline label="Estimate" placeholder="Add estimate" value="" onsave={() => {}} />
	</div>
	<p class="note">saved {saves} {saves === 1 ? 'time' : 'times'}</p>
</div>

<style>
	.rows {
		display: grid;
		gap: 0.3em;
		max-width: 32em;
		margin: 1em;
	}

	.row {
		display: grid;
		grid-template-columns: 7em 1fr;
		align-items: start;
		font-size: 0.9em;
	}

	.key {
		padding-top: 0.25em;
		color: var(--dim);
	}

	.note {
		margin: 0.6em 0 0;
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
