<script module lang="ts">
	import type { Range as DateRange } from './day';

	export type Footer = { range: DateRange };
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Button from '../input/Button.svelte';
	import Popover from '../popover/Popover.svelte';
	import Calendar from './Calendar.svelte';
	import { dates } from './ctx';
	import { format, last, shift, today, valid, type Day, type Range } from './day';

	let {
		range = $bindable(last(30, today(dates().zone))),
		presets = [7, 30, 90, 365],
		max,
		maxSpan = 366,
		label = 'Period',
		onchange,
		footer
	}: {
		range?: Range;
		/** Trailing spans in days, ending on `max`. */
		presets?: number[];
		/** The last pickable day; defaults to today in the zone. */
		max?: Day;
		maxSpan?: number;
		label?: string;
		onchange?: (range: Range) => void;
		/** Extra content before the actions. It receives only the primary draft range. */
		footer?: Snippet<[Footer]>;
	} = $props();

	const cfg = dates();
	const phone = new MediaQuery('max-width: 30em');
	const end = $derived(max ?? today(cfg.zone));
	const month = $derived(end.slice(0, 8) + '01');
	const opts = $derived([
		...presets.map((days) => ({
			label: days === 365 ? 'Last year' : `Last ${days} days`,
			short: days === 365 ? '1y' : `${days}d`,
			range: last(days, end)
		})),
		{ label: 'This month', short: 'This month', range: { start: month, end } },
		{
			label: 'Last month',
			short: 'Last month',
			range: { start: shift(month, { months: -1 }), end: shift(month, { days: -1 }) }
		}
	]);

	let open = $state(false);
	let draft = $state.raw<Range>({ ...range });
	let calendar: { reset(): void } | undefined = $state();

	const same = (a: Range, b: Range) => a.start === b.start && a.end === b.end;
	const chosen = $derived(opts.find((one) => same(range, one.range)));
	const ok = $derived(valid(draft, maxSpan) && draft.end <= end);
	const short = (day: Day, year = true) =>
		format(day, cfg.locale, {
			month: 'short',
			day: 'numeric',
			year: year ? 'numeric' : undefined
		});
	const title = $derived(
		chosen?.label ??
			`${short(range.start)} – ${short(range.end, range.start.slice(0, 4) !== range.end.slice(0, 4))}`
	);

	function toggle(next: boolean) {
		open = next;
		draft = { ...range };
		calendar?.reset();
	}

	function apply() {
		if (!ok) return;
		range = draft;
		onchange?.(draft);
		open = false;
	}
</script>

<Popover bind:open={() => open, toggle} sheet wide align="end" {label}>
	{#snippet trigger(attrs)}
		<button type="button" class="trigger" {...attrs}>
			<svg viewBox="0 0 16 16" aria-hidden="true">
				<rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
				<path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
			</svg>
			<span>{title}</span>
			<svg class="chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
		</button>
	{/snippet}

	{#snippet children(close)}
		<div class="content">
			<nav class="presets" aria-label="Preset periods">
				{#each opts as one (one.label)}
					<button
						type="button"
						class={['preset', { on: same(draft, one.range) }]}
						onclick={() => {
							draft = { ...one.range };
							calendar?.reset();
						}}
					>
						<span>{one.label}</span>
						<small>{one.short}</small>
					</button>
				{/each}
			</nav>

			<div class="main">
				<div class="calendar">
					<Calendar
						bind:this={calendar}
						mode="range"
						months={phone.current ? 1 : 2}
						value={draft}
						max={end}
						{maxSpan}
						autofocus
						onchange={(next) => (draft = { ...next })}
					/>
				</div>

				<div class="fields">
					<label>
						<span>From</span>
						<input
							type="date"
							value={draft.start}
							max={draft.end}
							onchange={(e) => (draft = { ...draft, start: e.currentTarget.value })}
						/>
					</label>
					<label>
						<span>To</span>
						<input
							type="date"
							value={draft.end}
							min={draft.start}
							max={end}
							onchange={(e) => (draft = { ...draft, end: e.currentTarget.value })}
						/>
					</label>
				</div>
			</div>
		</div>

		<div class="footer">
			<div class="extra">{@render footer?.({ range: draft })}</div>
			<div class="actions">
				<Button variant="ghost" onclick={close}>Cancel</Button>
				<Button variant="primary" disabled={!ok} onclick={apply}>Apply</Button>
			</div>
		</div>
	{/snippet}
</Popover>

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		min-height: var(--control);
		padding: 0 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-1);
		font: inherit;
		font-size: 0.93em;
		white-space: nowrap;
		cursor: pointer;
	}

	.trigger:hover,
	.trigger[aria-expanded='true'] {
		border-color: var(--border-bright);
		background: var(--surface-2);
	}

	.trigger:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: var(--ring);
	}

	.trigger svg {
		flex: none;
		width: 1em;
		height: 1em;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.trigger .chevron {
		color: var(--dim);
	}

	.content {
		display: flex;
		min-width: 39em;
	}

	.presets {
		display: flex;
		flex: 0 0 10.5em;
		flex-direction: column;
		gap: 1px;
		padding: 0.3em 0.55em 0.3em 0.2em;
		border-right: 1px solid var(--border);
	}

	.preset {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.7em;
		min-height: 2.2em;
		padding: 0 0.55em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 0.86em;
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
	}

	.preset small {
		color: var(--dim);
		font-size: 0.78em;
	}

	.preset:hover,
	.preset:focus-visible {
		background: var(--hover);
		outline: none;
	}

	.preset.on {
		background: var(--selected);
		box-shadow: inset 2px 0 0 var(--accent);
	}

	.main {
		min-width: 0;
		padding: 0 0.25em 0.3em;
	}

	.fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6em;
		padding: 0.65em 0.35em 0.2em;
		border-top: 1px solid var(--border);
	}

	.fields label {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.55em;
		color: var(--dim);
		font-size: 0.78em;
		text-transform: uppercase;
	}

	.fields input {
		min-width: 0;
		height: var(--control);
		padding: 0 0.65em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: 1.1em;
		box-shadow: var(--shadow-1);
	}

	.fields input:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: var(--ring);
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8em;
		padding: 0.55em 0.3em 0.25em;
		border-top: 1px solid var(--border);
	}

	.extra {
		min-width: 0;
	}

	.actions {
		display: flex;
		gap: 0.35em;
		margin-left: auto;
	}

	@media (max-width: 30em) {
		.content {
			min-width: 0;
			flex-direction: column;
		}

		.presets {
			flex: none;
			flex-direction: row;
			overflow-x: auto;
			padding: 0.2em 0 0.55em;
			border-right: none;
			border-bottom: 1px solid var(--border);
		}

		.preset {
			flex: none;
			min-height: 2.75rem;
			border: 1px solid var(--border);
		}

		.preset small {
			display: none;
		}

		.main {
			--calendar-width: 100%;
			--calendar-month-width: 100%;
			--grid-width: 100%;
			--day-width: 100%;
			--day-height: 2.75rem;
			padding: 0;
		}

		.fields {
			grid-template-columns: 1fr;
		}

		.footer {
			position: sticky;
			bottom: 0;
			background: var(--surface);
		}
	}
</style>
