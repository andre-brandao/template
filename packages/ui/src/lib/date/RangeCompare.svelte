<script lang="ts">
	import { dates } from './ctx';
	import { format, type Range } from './day';
	import { comparison, type CompareMode, type Comparison } from './compare';

	let {
		range,
		mode = $bindable(),
		custom = $bindable(),
		onchange
	}: {
		range: Range;
		mode?: CompareMode;
		custom?: Range;
		onchange?: (value?: Comparison) => void;
	} = $props();

	const cfg = dates();
	const value = $derived(mode ? comparison(range, mode, custom) : undefined);
	const label = (day: string) =>
		format(day, cfg.locale, { month: 'short', day: 'numeric', year: 'numeric' });

	function select(next: string) {
		mode = (next || undefined) as CompareMode | undefined;
		if (mode === 'custom' && !custom) custom = comparison(range, 'previous').range;
		onchange?.(mode ? comparison(range, mode, custom) : undefined);
	}

	function set(part: 'start' | 'end', day: string) {
		custom = { ...(custom ?? comparison(range, 'previous').range), [part]: day };
		onchange?.(comparison(range, 'custom', custom));
	}
</script>

<div class="compare">
	<label>
		<span>Compare</span>
		<select
			aria-label="Comparison"
			value={mode ?? ''}
			onchange={(e) => select(e.currentTarget.value)}
		>
			<option value="">No comparison</option>
			<option value="previous">Previous period</option>
			<option value="weekdays">Matching weekdays</option>
			<option value="year">Same period last year</option>
			<option value="custom">Custom range</option>
		</select>
	</label>

	{#if mode === 'custom'}
		<div class="custom">
			<input
				type="date"
				aria-label="Comparison from"
				value={custom?.start ?? ''}
				max={custom?.end}
				onchange={(e) => set('start', e.currentTarget.value)}
			/>
			<span aria-hidden="true">–</span>
			<input
				type="date"
				aria-label="Comparison to"
				value={custom?.end ?? ''}
				min={custom?.start}
				onchange={(e) => set('end', e.currentTarget.value)}
			/>
		</div>
	{:else if value}
		<span class="range">{label(value.range.start)} – {label(value.range.end)}</span>
	{/if}
</div>

<style>
	.compare {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.45em;
		color: var(--dim);
		font-size: 0.78em;
		text-transform: uppercase;
	}

	select,
	input {
		min-width: 0;
		height: var(--control);
		padding: 0 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-1);
		font: inherit;
		font-size: 1.08em;
	}

	select:focus-visible,
	input:focus-visible {
		border-color: var(--accent);
		box-shadow: var(--ring);
		outline: none;
	}

	.range {
		color: var(--dim);
		font-size: 0.76em;
		white-space: nowrap;
	}

	.custom {
		display: flex;
		align-items: center;
		gap: 0.35em;
	}

	.custom input {
		width: 8.5rem;
		font-size: 0.78em;
	}

	@media (max-width: 30em) {
		.compare {
			align-items: stretch;
			flex-direction: column;
			width: 100%;
		}

		label,
		.custom {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
		}

		.custom {
			grid-template-columns: 1fr auto 1fr;
		}

		.custom input {
			width: auto;
		}
	}
</style>
