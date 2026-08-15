<script module lang="ts">
	import type { Story } from '../story';
	import RangePicker, { last, valid } from './RangePicker.svelte';

	export const story: Story = {
		title: 'RangePicker',
		blurb: '`range` is bindable; `onchange` fires after the control has repainted.',
		of: RangePicker
	};
</script>

<script lang="ts">
	// Imports the markup below needs — they sit in the story's module block, which is not shown.
	// import { RangePicker, last, valid } from '@template/ui';

	let range = $state(last(30));
	let fired = $state(0);
</script>

<RangePicker bind:range onchange={() => fired++} />

<dl>
	<dt>range</dt>
	<dd>{range.start} → {range.end}</dd>
	<dt>valid</dt>
	<dd>{valid(range)}</dd>
	<dt>onchange</dt>
	<dd>fired {fired} {fired === 1 ? 'time' : 'times'}</dd>
</dl>

<p class="note">Custom presets:</p>
<RangePicker range={last(1)} presets={[1, 14, 180]} />

<style>
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.3em 1em;
		margin-top: 1.2em;
		font-family: var(--font-mono);
		font-size: 0.8em;
	}

	dt {
		color: var(--dim);
	}

	dd {
		margin: 0;
		color: var(--ink);
	}

	.note {
		margin: 1.4em 0 0.6em;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
