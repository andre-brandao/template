<script module lang="ts">
	import type { Day } from './day';

	/** What a cell is, beyond its day; `start`/`end`/`within` paint a range. */
	export type Look = {
		selected?: boolean;
		disabled?: boolean;
		start?: boolean;
		end?: boolean;
		within?: boolean;
		mark?: boolean;
	};

	export type Cell = Look & { day: Day; date: number; today: boolean; outside: boolean };
</script>

<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import { endOfMonth, parseDate } from '@internationalized/date';
	import { dates } from './ctx';
	import { format, shift, today, week, weekdays } from './day';

	let {
		month,
		focus = $bindable(),
		look,
		outside = true,
		autofocus = false,
		onpick,
		onhover,
		cell
	}: {
		/** Any day in the month to show. */
		month: Day;
		/** The roving tab stop; arrows, Home/End and PgUp/PgDn move it. */
		focus: Day;
		look?: (day: Day) => Look;
		/** Show the neighbouring months' days in the leading and trailing weeks. */
		outside?: boolean;
		/** Marks the tab stop `autofocus`, so a popover lands on it. */
		autofocus?: boolean;
		onpick?: (day: Day) => void;
		onhover?: (day: Day | undefined) => void;
		cell?: Snippet<[Cell]>;
	} = $props();

	const cfg = dates();
	const now = $derived(today(cfg.zone));
	const first = $derived(month.slice(0, 8) + '01');
	const end = $derived(endOfMonth(parseDate(first)).toString());
	const head = $derived(weekdays(cfg.locale, cfg.weekStart, 'short'));
	const full = $derived(weekdays(cfg.locale, cfg.weekStart, 'long'));
	// Six weeks always, so a popover keeps its size from month to month.
	const weeks = $derived(
		Array.from({ length: 6 }, (_, w) =>
			Array.from({ length: 7 }, (_, d) => shift(week(first, cfg.weekStart), { days: w * 7 + d }))
		)
	);
	const stop = $derived(focus >= first && focus <= end ? focus : undefined);

	let grid: HTMLTableElement | undefined = $state();

	const moves: Record<string, (day: Day, shiftKey: boolean) => Day> = {
		ArrowLeft: (day) => shift(day, { days: -1 }),
		ArrowRight: (day) => shift(day, { days: 1 }),
		ArrowUp: (day) => shift(day, { days: -7 }),
		ArrowDown: (day) => shift(day, { days: 7 }),
		Home: (day) => week(day, cfg.weekStart),
		End: (day) => shift(week(day, cfg.weekStart), { days: 6 }),
		PageUp: (day, year) => shift(day, year ? { years: -1 } : { months: -1 }),
		PageDown: (day, year) => shift(day, year ? { years: 1 } : { months: 1 })
	};

	async function keydown(e: KeyboardEvent) {
		const move = moves[e.key];
		if (!move || e.altKey || e.ctrlKey || e.metaKey) return;
		e.preventDefault();
		focus = move(focus, e.shiftKey);
		await tick();
		// The day may now sit in a sibling grid of the same calendar.
		const root = grid?.closest('[data-dates]') ?? grid;
		root?.querySelector<HTMLElement>(`[data-day="${focus}"]`)?.focus();
	}

	const label = (day: Day) => format(day, cfg.locale, { dateStyle: 'full' });

	const read = (day: Day): Cell => ({
		...look?.(day),
		day,
		date: Number(day.slice(8)),
		today: day === now,
		outside: day < first || day > end
	});
</script>

{#snippet button(info: Cell)}
	<!-- svelte-ignore a11y_autofocus -->
	<button
		type="button"
		class={[
			'day',
			{
				away: info.outside,
				now: info.today,
				on: info.selected,
				off: info.disabled,
				start: info.start,
				end: info.end,
				within: info.within
			}
		]}
		data-day={info.day}
		tabindex={info.day === stop ? 0 : -1}
		autofocus={autofocus && info.day === stop}
		aria-label={label(info.day)}
		aria-current={info.today ? 'date' : undefined}
		aria-disabled={info.disabled}
		onclick={() => {
			focus = info.day;
			if (!info.disabled) onpick?.(info.day);
		}}
		onpointerenter={() => onhover?.(info.day)}
		onfocus={() => onhover?.(info.day)}
	>
		{#if cell}
			{@render cell(info)}
		{:else}
			{info.date}
			{#if info.mark}<span class="mark"></span>{/if}
		{/if}
	</button>
{/snippet}

<table
	class="grid"
	role="grid"
	bind:this={grid}
	aria-label={format(first, cfg.locale, { month: 'long', year: 'numeric' })}
	onkeydown={keydown}
	onpointerleave={() => onhover?.(undefined)}
>
	<thead>
		<tr>
			{#each head as one, i (one.key)}
				<th scope="col" abbr={full[i].label}>{one.label}</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each weeks as days (days[0])}
			<tr>
				{#each days.map(read) as info (info.day)}
					<td role="gridcell" aria-selected={info.selected ?? false} aria-disabled={info.disabled}>
						{#if !info.outside || outside}{@render button(info)}{/if}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	/* The size tokens let a page grow the grid into a full calendar. */
	.grid {
		width: var(--grid-width, auto);
		border-collapse: collapse;
		table-layout: fixed;
		font-size: 0.85em;
	}

	th {
		height: 2em;
		color: var(--dim, #8e8c86);
		font-size: 0.85em;
		font-weight: 500;
	}

	td {
		padding: 1px 0;
		text-align: center;
	}

	.day {
		position: relative;
		width: var(--day-width, 2.3em);
		height: var(--day-height, 2.1em);
		padding: 0;
		border: none;
		border-radius: var(--radius-sm, 6px);
		background: none;
		color: var(--ink, #1c1b19);
		font: inherit;
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}

	.day:hover {
		background: var(--hover, #f1f0ed);
	}

	.day:focus-visible {
		outline: 2px solid var(--accent, #2f7f68);
		outline-offset: -2px;
	}

	.away {
		color: var(--dim, #8e8c86);
	}

	.now {
		font-weight: 600;
		color: var(--accent, #2f7f68);
	}

	.within {
		border-radius: 0;
		background: color-mix(in oklab, var(--accent, #2f7f68) 14%, transparent);
	}

	.start {
		border-radius: var(--radius-sm, 6px) 0 0 var(--radius-sm, 6px);
	}

	.end {
		border-radius: 0 var(--radius-sm, 6px) var(--radius-sm, 6px) 0;
	}

	.start.end {
		border-radius: var(--radius-sm, 6px);
	}

	.on,
	.on:hover {
		background: var(--accent, #2f7f68);
		color: var(--on-accent, #fff);
	}

	.off {
		color: var(--dim, #8e8c86);
		text-decoration: line-through;
		cursor: not-allowed;
	}

	.off:hover {
		background: none;
	}

	.mark {
		position: absolute;
		left: 50%;
		bottom: 0.25em;
		width: 0.25em;
		height: 0.25em;
		border-radius: 50%;
		background: currentColor;
		translate: -50% 0;
	}
</style>
