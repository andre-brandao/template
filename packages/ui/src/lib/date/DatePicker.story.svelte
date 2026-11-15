<script module lang="ts">
	import type { Story } from '../story';
	import DatePicker from './DatePicker.svelte';

	export const story: Story = {
		title: 'DatePicker',
		blurb:
			'Type or pick. The field reads `today`/`tod`, `tomorrow`/`tmr`, `yesterday`, `+3d -2w +1m`, `in 3 days`, `fri`, `next fri`, `eow`, `eom`, ISO, or numbers in the locale order, and previews the match as you type; Enter or blur commits. `value` is a day, or with `time` an ISO instant in the zone (a day without a time stores the start of that day). In the popover `T` picks today and Backspace clears. The `trigger` snippet swaps the field for a quiet button and moves the field into the popover. `name` submits through a hidden input.',
		of: DatePicker,
		props: {
			clearable: { type: 'bool', value: true },
			time: { type: 'bool', value: false },
			placeholder: { type: 'text', value: 'Due date' }
		},
		remount: true
	};
</script>

<script lang="ts">
	// import { DatePicker, setDates } from '@template/ui';
	import { setDates } from './ctx';

	// The story pins the zone the way the app does from the user's stored preference.
	setDates({ locale: 'en-GB', zone: 'America/Sao_Paulo' });

	const presets = [
		{ label: 'Today', value: 'today' },
		{ label: 'Tomorrow', value: 'tmr' },
		{ label: 'Next week', value: 'next mon' },
		{ label: 'End of month', value: 'eom' }
	];

	let day: string | undefined = $state();
	let due: string | undefined = $state();
	let start: string | undefined = $state();
</script>

<div class="grid">
	<span>day, presets</span>
	<DatePicker bind:value={day} clearable {presets} placeholder="Due date" />
	<code>{day ?? '—'}</code>

	<span>with time</span>
	<DatePicker bind:value={due} time clearable name="due" />
	<code>{due ?? '—'}</code>

	<span>quiet trigger</span>
	<DatePicker bind:value={start} clearable {presets}>
		{#snippet trigger(attrs, label)}
			<button class="chip" {...attrs}>{label || 'No start date'}</button>
		{/snippet}
	</DatePicker>
	<code>{start ?? '—'}</code>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: auto auto 1fr;
		align-items: center;
		gap: 0.8em 1.2em;
	}

	span {
		color: var(--dim);
		font-size: 0.8em;
	}

	code {
		color: var(--muted);
		font-size: 0.78em;
	}

	.chip {
		justify-self: start;
		padding: 0.25em 0.6em;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		font: inherit;
		font-size: 0.85em;
		cursor: pointer;
	}

	.chip:hover {
		background: var(--hover);
		color: var(--ink);
	}
</style>
