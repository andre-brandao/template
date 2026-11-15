<script module lang="ts">
	import type { Story } from '../story';
	import RangePicker from './RangePicker.svelte';
	import { last, valid } from './day';

	export const story: Story = {
		title: 'RangePicker',
		blurb:
			'Trailing presets inline, and "Custom" opens a two-month range calendar with the same presets plus this and last month. `range` is bindable; `onchange` fires after the control has repainted. `max` (default today in the zone) caps the end, `maxSpan` the length. In the popover `T` jumps to today and Backspace drops a half-picked range.',
		of: RangePicker
	};
</script>

<script lang="ts">
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

<p class="note">Custom presets, capped at 31 days:</p>
<RangePicker range={last(1)} presets={[1, 14]} maxSpan={31} />

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
