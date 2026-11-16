<script module lang="ts">
	import type { Story } from '../story';
	import RangeCompare from './RangeCompare.svelte';
	import RangePicker from './RangePicker.svelte';
	import { last, valid, type Range } from './day';
	import { preset, trailing } from './preset';
	import type { CompareMode } from './compare';

	export const story: Story = {
		title: 'RangePicker',
		blurb:
			'A compact period trigger opens composable presets, a two-month range calendar and typed bounds. Changes stay in a draft until Apply; Cancel, Escape and outside clicks discard them. Numeric presets remain shorthand for trailing days. `footer` composes optional state such as `RangeCompare` without putting it in the primary picker.',
		of: RangePicker
	};
</script>

<script lang="ts">
	// import { RangePicker, last, valid } from '@template/ui';

	let range = $state(last(30));
	let fired = $state(0);
	let mode = $state<CompareMode>();
	let custom = $state<Range>();
</script>

<RangePicker bind:range onchange={() => fired++}>
	{#snippet footer(ctx)}
		<RangeCompare range={ctx.range} bind:mode bind:custom />
	{/snippet}
</RangePicker>

<dl>
	<dt>range</dt>
	<dd>{range.start} → {range.end}</dd>
	<dt>valid</dt>
	<dd>{valid(range)}</dd>
	<dt>onchange</dt>
	<dd>fired {fired} {fired === 1 ? 'time' : 'times'}</dd>
</dl>

<p class="note">Custom presets, capped at 31 days:</p>
<RangePicker
	range={last(1)}
	presets={[preset.today, preset.yesterday, trailing(14), preset.month]}
	maxSpan={31}
/>

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
