<script module lang="ts">
	import type { Day, Range } from './day';

	export type Mode = 'single' | 'range' | 'multiple';
	export type Value<M extends Mode> = { single: Day; range: Range; multiple: Day[] }[M];
</script>

<script lang="ts" generics="M extends Mode = 'single'">
	import type { Snippet } from 'svelte';
	import { dates } from './ctx';
	import { format, shift, today } from './day';
	import MonthGrid, { type Cell, type Look } from './MonthGrid.svelte';

	let {
		mode = 'single' as M,
		value = $bindable(),
		months = 1,
		min,
		max,
		disabled,
		marks = [],
		maxSpan,
		autofocus = false,
		onchange,
		cell
	}: {
		mode?: M;
		value?: Value<M>;
		/** Months shown side by side. */
		months?: number;
		min?: Day;
		max?: Day;
		disabled?: (day: Day) => boolean;
		/** Days that get a dot, like ones with something due. */
		marks?: Day[];
		/** Range mode: the longest pick, in days. */
		maxSpan?: number;
		autofocus?: boolean;
		/** Fires on a whole pick: a day, both ends of a range, or the toggled set. */
		onchange?: (value: Value<M>) => void;
		cell?: Snippet<[Cell]>;
	} = $props();

	const cfg = dates();

	const raw = $derived(value as any);
	const picked = $derived(mode === 'range' ? raw?.end : mode === 'multiple' ? raw?.[0] : raw) as
		| Day
		| undefined;

	// Both follow the value until arrows or the header move them; a range ends on the last month.
	let focus = $derived(picked ?? today(cfg.zone));
	let view = $derived(
		shift((picked ?? today(cfg.zone)).slice(0, 8) + '01', {
			months: mode === 'range' ? 1 - months : 0
		})
	);
	let draft: Day | undefined = $state();
	let hover: Day | undefined = $state();

	const last = $derived(shift(view, { months: months - 1 }));
	const pages = $derived(Array.from({ length: months }, (_, i) => shift(view, { months: i })));

	// Keeps the focused day on screen when keys carry it past either edge.
	function move(day: Day) {
		focus = day;
		const month = day.slice(0, 8) + '01';
		if (month < view) view = month;
		if (month > last) view = shift(month, { months: 1 - months });
	}

	function page(by: number) {
		view = shift(view, { months: by });
		focus = shift(focus, { months: by });
	}

	/** Moves the tab stop to `day` and focuses it, like the `T` hotkey. */
	export function jump(day: Day) {
		move(day);
		requestAnimationFrame(() => root?.querySelector<HTMLElement>(`[data-day="${day}"]`)?.focus());
	}

	/** Drops a half-picked range. */
	export function reset() {
		draft = undefined;
	}

	let root: HTMLDivElement | undefined = $state();

	const span = (a: Day, b: Day) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

	function blocked(day: Day) {
		if ((min && day < min) || (max && day > max) || disabled?.(day)) return true;
		return !!(draft && maxSpan && Math.abs(span(draft, day)) >= maxSpan);
	}

	const set = (next: Value<M>) => {
		value = next;
		onchange?.(next);
	};

	function pick(day: Day) {
		if (mode === 'single') return set(day as Value<M>);
		if (mode === 'multiple') {
			const list: Day[] = raw ?? [];
			const next = list.includes(day) ? list.filter((one) => one !== day) : [...list, day].sort();
			return set(next as Value<M>);
		}
		if (!draft) {
			draft = day;
			return;
		}
		const range = draft <= day ? { start: draft, end: day } : { start: day, end: draft };
		draft = undefined;
		set(range as Value<M>);
	}

	// While half picked, the range follows the pointer or the focused day.
	const band = $derived.by(() => {
		if (mode !== 'range') return;
		if (draft) {
			const to = hover ?? focus;
			return to < draft ? { start: to, end: draft } : { start: draft, end: to };
		}
		return raw as Range | undefined;
	});
	const day = (value: Day) => format(value, cfg.locale, { dateStyle: 'full' });
	const notice = $derived.by(() => {
		if (mode !== 'range') return '';
		if (draft) return `Start date ${day(draft)}. Choose an end date.`;
		const range = raw as Range | undefined;
		if (range) return `Selected range ${day(range.start)} through ${day(range.end)}.`;
		return 'Choose a start date, then an end date.';
	});

	function look(day: Day): Look {
		const off = blocked(day);
		const mark = marks.includes(day);
		if (mode === 'multiple') return { selected: (raw ?? []).includes(day), disabled: off, mark };
		if (mode === 'single') return { selected: day === raw, disabled: off, mark };
		const edge = !!band && (day === band.start || day === band.end);
		return {
			selected: edge,
			disabled: off,
			mark,
			start: day === band?.start,
			end: day === band?.end,
			within: !!band && day > band.start && day < band.end
		};
	}

	const title = (month: Day) => format(month, cfg.locale, { month: 'long', year: 'numeric' });
</script>

<div class="calendar" data-dates bind:this={root}>
	{#if notice}<p class="notice" role="status" aria-live="polite" aria-atomic="true">
			{notice}
		</p>{/if}
	<div class="months">
		{#each pages as month, i (month)}
			<div class="month">
				<div class="head">
					{#if i === 0}
						<button type="button" class="nav" aria-label="Previous month" onclick={() => page(-1)}>
							<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
						</button>
					{/if}
					<span class="title" aria-live="polite">{title(month)}</span>
					{#if i === months - 1}
						<button type="button" class="nav" aria-label="Next month" onclick={() => page(1)}>
							<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
						</button>
					{/if}
				</div>
				<MonthGrid
					{month}
					bind:focus={() => focus, move}
					{look}
					{cell}
					outside={months === 1}
					{autofocus}
					onpick={pick}
					onhover={(day) => (hover = day)}
				/>
			</div>
		{/each}
	</div>
</div>

<style>
	.calendar {
		display: inline-block;
		width: var(--calendar-width, auto);
		padding: 0.3em;
	}

	.months {
		display: flex;
		flex-wrap: wrap;
		gap: 1.2em;
	}

	.month {
		width: var(--calendar-month-width, auto);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.3em;
		height: 2em;
		margin-bottom: 0.2em;
	}

	.title {
		flex: 1;
		text-align: center;
		color: var(--ink);
		font-size: 0.88em;
		font-weight: 600;
	}

	.nav {
		display: grid;
		place-items: center;
		width: 1.8em;
		height: 1.8em;
		padding: 0;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.nav:hover {
		background: var(--hover);
		color: var(--ink);
	}

	.nav svg {
		width: 1em;
		height: 1em;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.notice {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
