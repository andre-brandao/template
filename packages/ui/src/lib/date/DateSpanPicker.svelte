<script module lang="ts">
	export type Span = { start?: string; finish?: string };
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Button from '../input/Button.svelte';
	import Popover, { type Trigger } from '../popover/Popover.svelte';
	import Calendar from './Calendar.svelte';
	import { dates } from './ctx';
	import { at, format, split, valid, type Day, type Range } from './day';

	type Part = { day: string; clock: string };

	let {
		start = $bindable(),
		finish = $bindable(),
		startName,
		finishName,
		startLabel = 'Start',
		finishLabel = 'Finish',
		label = 'Dates',
		time = false,
		min,
		max,
		maxSpan = 366,
		onchange,
		trigger
	}: {
		/** A day, or an instant when `time` is set. */
		start?: string;
		/** A day, or an instant when `time` is set. */
		finish?: string;
		startName?: string;
		finishName?: string;
		startLabel?: string;
		finishLabel?: string;
		label?: string;
		time?: boolean;
		min?: Day;
		max?: Day;
		maxSpan?: number;
		onchange?: (span: Span) => void;
		trigger?: Snippet<[attrs: Trigger, label: string]>;
	} = $props();

	const cfg = dates();
	const phone = new MediaQuery('max-width: 30em');
	const empty = (): Part => ({ day: '', clock: '' });
	const read = (value?: string): Part => {
		if (!value) return empty();
		if (!time) return /^\d{4}-\d{2}-\d{2}$/.test(value) ? { day: value, clock: '' } : empty();
		if (Number.isNaN(Date.parse(value))) return empty();
		return split(value, cfg.zone);
	};
	const write = (part: Part) =>
		part.day ? (time ? at(part.day, part.clock, cfg.zone) : part.day) : undefined;

	let open = $state(false);
	let from = $state.raw<Part>(read(start));
	let to = $state.raw<Part>(read(finish));

	const range = $derived<Range | undefined>(
		from.day && to.day ? { start: from.day, end: to.day } : undefined
	);
	const ordered = $derived(!range || valid(range, maxSpan));
	const clocks = $derived(
		!range || range.start !== range.end || !from.clock || !to.clock || from.clock <= to.clock
	);
	const bounded = $derived(
		(!from.day || ((!min || from.day >= min) && (!max || from.day <= max))) &&
			(!to.day || ((!min || to.day >= min) && (!max || to.day <= max)))
	);
	const ok = $derived(ordered && clocks && bounded);

	const show = (value?: string) => {
		const part = read(value);
		if (!part.day) return '';
		const day = format(part.day, cfg.locale, { dateStyle: 'medium' });
		return part.clock
			? `${day}, ${format(part.day, cfg.locale, { timeStyle: 'short' }, part.clock)}`
			: day;
	};
	const text = $derived.by(() => {
		const a = show(start);
		const b = show(finish);
		if (a && b) return `${a} → ${b}`;
		if (a) return `${startLabel} ${a}`;
		if (b) return `${finishLabel} ${b}`;
		return 'No dates';
	});

	function toggle(next: boolean) {
		open = next;
		from = read(start);
		to = read(finish);
	}

	function apply() {
		if (!ok) return;
		const next = { start: write(from), finish: write(to) };
		start = next.start;
		finish = next.finish;
		onchange?.(next);
		open = false;
	}
</script>

{#snippet opener(attrs: Trigger)}
	{#if trigger}
		{@render trigger(attrs, text)}
	{:else}
		<button type="button" class="trigger" {...attrs}>
			<span>{text}</span>
			<svg viewBox="0 0 16 16" aria-hidden="true">
				<rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
				<path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
			</svg>
		</button>
	{/if}
{/snippet}

<Popover bind:open={() => open, toggle} sheet wide {label} trigger={opener}>
	{#snippet children(close)}
		<div class="calendar">
			<Calendar
				mode="range"
				months={phone.current ? 1 : 2}
				value={range}
				{min}
				{max}
				{maxSpan}
				autofocus
				onchange={(next) => {
					from = { ...from, day: next.start };
					to = { ...to, day: next.end };
				}}
			/>
		</div>

		<div class={['fields', { timed: time }]}>
			<label>
				<span>{startLabel}</span>
				<input
					type="date"
					value={from.day}
					{min}
					max={to.day || max}
					onchange={(e) => (from = { ...from, day: e.currentTarget.value })}
				/>
				{#if time}
					<input
						type="time"
						aria-label="{startLabel} time"
						value={from.clock}
						disabled={!from.day}
						onchange={(e) => (from = { ...from, clock: e.currentTarget.value })}
					/>
				{/if}
			</label>
			<label>
				<span>{finishLabel}</span>
				<input
					type="date"
					value={to.day}
					min={from.day || min}
					{max}
					onchange={(e) => (to = { ...to, day: e.currentTarget.value })}
				/>
				{#if time}
					<input
						type="time"
						aria-label="{finishLabel} time"
						value={to.clock}
						disabled={!to.day}
						onchange={(e) => (to = { ...to, clock: e.currentTarget.value })}
					/>
				{/if}
			</label>
		</div>

		{#if !ok}<p class="issue">Finish must follow start and stay within the allowed range.</p>{/if}

		<div class="footer">
			<Button
				variant="ghost"
				onclick={() => {
					from = empty();
					to = empty();
				}}>Clear</Button
			>
			<div class="actions">
				<Button variant="ghost" onclick={close}>Cancel</Button>
				<Button variant="primary" disabled={!ok} onclick={apply}>Apply</Button>
			</div>
		</div>
	{/snippet}
</Popover>

{#if startName}<input type="hidden" name={startName} value={start ?? ''} />{/if}
{#if finishName}<input type="hidden" name={finishName} value={finish ?? ''} />{/if}

<style>
	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6em;
		width: 100%;
		min-height: var(--control);
		padding: 0 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-1);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.trigger:hover,
	.trigger[aria-expanded='true'] {
		border-color: var(--border-bright);
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
		stroke: var(--muted);
		stroke-width: 1.4;
		stroke-linecap: round;
	}

	.fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.65em;
		padding: 0.7em 0.35em;
		border-top: 1px solid var(--border);
	}

	.fields label {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.5em;
		color: var(--dim);
		font-size: 0.78em;
		text-transform: uppercase;
	}

	.fields.timed label {
		grid-template-columns: auto minmax(8.5em, 1fr) 6.5em;
	}

	.fields input {
		min-width: 0;
		height: var(--control);
		padding: 0 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: 1.08em;
		box-shadow: var(--shadow-1);
	}

	.fields input:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: var(--ring);
	}

	.fields input:disabled {
		opacity: 0.5;
	}

	.issue {
		margin: 0;
		padding: 0 0.5em 0.5em;
		color: var(--danger);
		font-size: 0.78em;
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8em;
		padding: 0.55em 0.3em 0.25em;
		border-top: 1px solid var(--border);
	}

	.actions {
		display: flex;
		gap: 0.35em;
	}

	@media (max-width: 30em) {
		.calendar {
			--calendar-width: 100%;
			--calendar-month-width: 100%;
			--grid-width: 100%;
			--day-width: 100%;
			--day-height: 2.75rem;
		}

		.fields,
		.fields.timed {
			grid-template-columns: 1fr;
		}

		.fields.timed label {
			grid-template-columns: auto minmax(0, 1fr) 6em;
		}

		.footer {
			position: sticky;
			bottom: 0;
			background: var(--surface);
		}
	}
</style>
