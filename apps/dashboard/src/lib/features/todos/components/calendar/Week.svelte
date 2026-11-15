<!-- Seven day columns: an all-day lane for dates and multi-day bars, an hour grid for times. -->
<script lang="ts">
	import { tick } from 'svelte';
	import { format, shift, split, today, week, type Day, type Weekday } from '@template/ui';
	import Chip from './Chip.svelte';
	import { lanes, minutes, slots, timed, type Item } from './layout';
	import type { Chips } from './CalendarView.svelte';

	let {
		focus = $bindable(),
		start,
		locale,
		zone,
		items,
		hit,
		preview,
		chips,
		onpick
	}: {
		focus: Day;
		start: Weekday;
		locale: string;
		zone: string;
		items: Item[];
		hit: (day: Day) => boolean;
		/** Where a drag in flight would land. */
		preview?: Item;
		chips: Chips;
		onpick: (day: Day, e: MouseEvent) => void;
	} = $props();

	const days = $derived(Array.from({ length: 7 }, (_, i) => shift(week(focus, start), { days: i })));
	const bars = $derived(lanes(items.filter((one) => !timed(one)), days[0]));
	const rows = $derived(Math.max(1, ...bars.map((bar) => bar.lane + 1)));
	const hours = $derived(
		new Map(days.map((day) => [day, slots(items.filter((one) => timed(one) && one.start === day))]))
	);
	const now = $derived(split(Date.now(), zone));
	const ghost = $derived(
		preview && timed(preview) ? slots([preview]).map((one) => ({ ...one, day: preview.start }))[0] : undefined
	);

	const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

	async function keydown(e: KeyboardEvent & { currentTarget: HTMLElement }) {
		const by = moves[e.key];
		if (!by || e.altKey || e.ctrlKey || e.metaKey) return;
		e.preventDefault();
		const head = e.currentTarget;
		focus = shift(focus, { days: by });
		await tick();
		head.querySelector<HTMLElement>(`[data-head="${focus}"]`)?.focus();
	}

	const pct = (minute: number) => `${(minute / 1440) * 100}%`;
</script>

<div class="week">
	<div class="row head" role="toolbar" aria-label="Days" tabindex="-1" onkeydown={keydown}>
		<span class="gutter"></span>
		{#each days as day (day)}
			<button
				type="button"
				class={['day', { now: day === today(zone) }]}
				data-head={day}
				tabindex={day === focus ? 0 : -1}
				aria-label="New todo on {format(day, locale, { dateStyle: 'full' })}"
				aria-current={day === today(zone) ? 'date' : undefined}
				onfocus={() => (focus = day)}
				onclick={(e) => onpick(day, e)}
			>
				<span class="dow">{format(day, locale, { weekday: 'short' })}</span>
				<span class="num">{Number(day.slice(8))}</span>
			</button>
		{/each}
	</div>

	<div class="row lane">
		<span class="gutter label">all day</span>
		<div class="bars" style:--rows={rows}>
			{#each days as day, i (day)}
				<div class={['col', { hit: hit(day) }]} data-day={day} style:grid-column={i + 1}>
					<button
						type="button"
						class="slot"
						tabindex="-1"
						aria-label="New todo on {format(day, locale, { dateStyle: 'full' })}"
						onclick={(e) => onpick(day, e)}
					></button>
				</div>
			{/each}
			{#each bars as bar (bar.item.todo.id)}
				<Chip
					todo={bar.item.todo}
					time={bar.head ? chips.time(bar.item) : ''}
					head={bar.head}
					tail={bar.tail}
					edge="right"
					link
					{...chips.mark(bar.item.todo.id)}
					grab={chips.grab}
					open={chips.open}
					style="grid-column: {bar.col + 1} / span {bar.span}; grid-row: {bar.lane +
						1}; z-index: 1; margin: 1px 2px"
				/>
			{/each}
		</div>
	</div>

	<div class="hours" {@attach (el) => el.scrollTo({ top: el.scrollHeight * (7 / 24) })}>
		<div class="row lines">
			<div class="gutter ticks">
				{#each Array.from({ length: 23 }, (_, h) => h + 1) as h (h)}
					<span style:top={pct(h * 60)}>{chips.hour(h * 60)}</span>
				{/each}
			</div>
			{#each days as day (day)}
				{@render column(day)}
			{/each}
		</div>
	</div>
</div>

{#snippet column(day: Day)}
	<div class="col" data-day={day} data-hours>
		<button
			type="button"
			class="slot"
			tabindex="-1"
			aria-label="New todo on {format(day, locale, { dateStyle: 'full' })}"
			onclick={(e) => onpick(day, e)}
		></button>
		{#each hours.get(day) ?? [] as one (one.item.todo.id)}
			<Chip
				todo={one.item.todo}
				time={chips.time(one.item)}
				edge={one.item.from && one.item.until ? 'bottom' : undefined}
				link
				block={one.end - one.top >= 60}
				{...chips.mark(one.item.todo.id)}
				grab={chips.grab}
				open={chips.open}
				style="position: absolute; z-index: 1; top: {pct(one.top)}; height: calc({pct(
					one.end - one.top
				)} - 2px); left: calc({(one.col / one.cols) * 100}% + 1px); width: calc({100 /
					one.cols}% - 3px)"
			/>
		{/each}
		{#if ghost?.day === day}
			<span class="ghost" style:top={pct(ghost.top)} style:height={pct(ghost.end - ghost.top)}
			></span>
		{/if}
		{#if day === now.day}
			<span class="line" style:top={pct(minutes(now.clock))}></span>
		{/if}
	</div>
{/snippet}

<style>
	.week {
		--gutter: 4.4rem;
		--hour: 2.6rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}

	.row {
		display: grid;
		grid-template-columns: var(--gutter) repeat(7, minmax(0, 1fr));
	}

	.gutter {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.66rem;
	}

	.head {
		border-bottom: 1px solid var(--border);
		outline: none;
	}

	.day {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.35em;
		padding: 0.45rem 0;
		border: none;
		background: none;
		color: var(--muted);
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.day:hover {
		background: var(--hover);
	}

	.day:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	.num {
		color: var(--ink);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.now .num {
		padding: 0 0.35em;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
	}

	/* Capped so a busy week can't push the hour grid off screen. */
	.lane {
		max-height: 10.5rem;
		overflow-y: auto;
		border-bottom: 1px solid var(--border);
		scrollbar-width: thin;
	}

	/* Pinned, since a busy lane scrolls and a centered label scrolls out of view. */
	.label {
		position: sticky;
		top: 0;
		align-self: start;
		padding: 0.45rem 0 0 0.5rem;
	}

	.bars {
		grid-column: 2 / -1;
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		grid-template-rows: repeat(var(--rows), 1.6rem);
		padding-bottom: 0.4rem;
	}

	.bars .col {
		grid-row: 1 / -1;
		margin-bottom: -0.4rem;
	}

	.col {
		position: relative;
		box-shadow: inset 1px 0 0 var(--border);
	}

	.col.hit {
		background: var(--selected);
	}

	.slot {
		position: absolute;
		inset: 0;
		padding: 0;
		border: none;
		background: none;
		cursor: cell;
	}

	.slot:hover {
		background: var(--hover);
	}

	.hours {
		max-height: 34rem;
		overflow-y: auto;
		scrollbar-width: thin;
	}

	.lines {
		height: calc(24 * var(--hour));
		background: repeating-linear-gradient(
			to bottom,
			transparent 0 calc(var(--hour) - 1px),
			color-mix(in oklab, var(--border) 70%, transparent) calc(var(--hour) - 1px) var(--hour)
		);
	}

	.ticks {
		position: relative;
		background: var(--surface);
	}

	.ticks span {
		position: absolute;
		right: 0.45rem;
		translate: 0 -50%;
		white-space: nowrap;
	}

	.ghost {
		position: absolute;
		left: 1px;
		right: 2px;
		z-index: 2;
		border: 1px dashed var(--accent);
		border-radius: 4px;
		background: var(--selected);
		pointer-events: none;
	}

	.line {
		position: absolute;
		left: 0;
		right: 0;
		z-index: 2;
		border-top: 1.5px solid var(--danger);
		pointer-events: none;
	}
</style>
