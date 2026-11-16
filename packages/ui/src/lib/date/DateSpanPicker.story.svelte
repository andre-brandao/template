<script module lang="ts">
	import type { Story } from '../story';
	import DateSpanPicker from './DateSpanPicker.svelte';

	export const story: Story = {
		title: 'DateSpanPicker',
		blurb:
			'A combined Start/Finish control for optional planned dates. It supports partial spans, optional wall-clock times, range selection, explicit Apply/Cancel and hidden form fields. On phones it becomes a full-width sheet with larger day targets.',
		of: DateSpanPicker
	};
</script>

<script lang="ts">
	let start = $state<string>();
	let finish = $state<string>();
</script>

<DateSpanPicker bind:start bind:finish time />

<dl>
	<dt>start</dt>
	<dd>{start ?? '—'}</dd>
	<dt>finish</dt>
	<dd>{finish ?? '—'}</dd>
</dl>

<style>
	dl {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.3em 1em;
		margin-top: 1em;
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
</style>
