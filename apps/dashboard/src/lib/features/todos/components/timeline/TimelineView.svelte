<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { Empty } from '@template/ui';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { group, type By } from '../../group';
	import Axis from './Axis.svelte';
	import Row from './Row.svelte';

	let { todos, by = 'stage' }: { todos: Todo.Info[]; by?: By } = $props();

	const DAY = 86_400_000;
	const me = user();
	const f = fmt();

	/** When work is meant to begin — the timeline reads top-down in start order. */
	function at(todo: Todo.Info) {
		const date = todo.startDate ?? todo.dueDate;
		return date ? Date.parse(date) : Infinity;
	}

	const rows = $derived(
		group(todos, by).map((row) => ({
			...row,
			items: [...row.items].sort((a, b) => at(a) - at(b) || a.title.localeCompare(b.title))
		}))
	);

	const stamps = (todo: Todo.Info) =>
		[todo.startDate, todo.dueDate, todo.timeStarted, todo.timeDone]
			.filter((at) => at !== null)
			.map(Date.parse);

	/** Whole days covering every date in view, always including today. */
	const span = $derived.by(() => {
		const all = todos.flatMap(stamps);
		if (all.length === 0) return null;
		const now = Date.now();
		const start = Math.floor(Math.min(...all, now) / DAY) * DAY - DAY;
		const end = Math.ceil(Math.max(...all, now) / DAY) * DAY + DAY;
		return { start, end, days: Math.round((end - start) / DAY) };
	});

	// Coarser buckets as the plan stretches, so the axis never turns into a smear.
	const unit = $derived(!span ? 'day' : span.days <= 70 ? 'day' : span.days <= 240 ? 'week' : 'month');

	// Days are ruled but only labelled weekly, so a column costs a fraction of its label.
	const col = $derived(unit === 'day' ? '1.7rem' : unit === 'week' ? '3.6rem' : '4.6rem');

	const short = $derived(
		new Intl.DateTimeFormat(me.prefs.locale ?? undefined, { month: 'short', day: 'numeric' })
	);
	const month = $derived(
		new Intl.DateTimeFormat(me.prefs.locale ?? undefined, { month: 'short', year: '2-digit' })
	);

	const ticks = $derived.by(() => {
		if (!span) return [];
		const cursor = new Date(span.start);
		if (unit === 'week') cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7));
		if (unit === 'month') cursor.setUTCDate(1);
		const out: number[] = [];
		while (cursor.getTime() <= span.end) {
			if (cursor.getTime() >= span.start) out.push(cursor.getTime());
			step(cursor);
		}
		return out.map(tick);
	});

	/** Advance the cursor one axis unit. */
	function step(cursor: Date) {
		if (unit === 'month') return cursor.setUTCMonth(cursor.getUTCMonth() + 1);
		cursor.setUTCDate(cursor.getUTCDate() + (unit === 'week' ? 7 : 1));
	}

	/** Label one ruled instant. */
	function tick(at: number) {
		const day = new Date(at).getUTCDay();
		return {
			at,
			text: unit === 'month' ? month.format(at) : short.format(at),
			major: unit !== 'day' || day === 1,
			off: unit === 'day' && (day === 0 || day === 6)
		};
	}

	const pct = (at: number) => (!span ? 0 : ((at - span.start) / (span.end - span.start)) * 100);

	/** A bar from two instants — a lone date still gets a day-wide mark. */
	function bar(from: string | null, to: string | null) {
		if (!span || (!from && !to)) return null;
		const a = Date.parse(from ?? to!);
		const b = Date.parse(to ?? from!);
		const lo = Math.min(a, b);
		const hi = Math.max(a, b, lo + DAY);
		return { left: pct(lo), width: Math.max(pct(hi) - pct(lo), 0.6) };
	}

	const actual = (todo: Todo.Info) =>
		todo.timeStarted ? bar(todo.timeStarted, todo.timeDone ?? new Date().toISOString()) : null;

	/** The window a group occupies, drawn behind its rows instead of above them. */
	function band(items: Todo.Info[]) {
		const all = items.flatMap((todo) => [todo.startDate, todo.dueDate]).filter((at) => at !== null);
		if (all.length === 0) return null;
		const sorted = all.map(Date.parse).sort((a, b) => a - b);
		return bar(new Date(sorted[0]!).toISOString(), new Date(sorted.at(-1)!).toISOString());
	}

	const today = $derived(pct(Date.now()));
</script>

{#if !span}
	<Empty>Give a todo a start or due date and it lands on the cronograma.</Empty>
{:else}
	<div class="wrap">
		<div class="grid" style:--cols={ticks.length} style:--col={col}>
			<Axis {ticks} {pct} {today} count={todos.length} days={span.days} />

			{#each rows as row (row.key)}
				{@const held = band(row.items)}
				<section class="stage">
					<div class="lane" style:min-height="calc({row.label.length} * 0.46rem + 3rem)">
						<span class="pin">
							<span class="tag" title={row.label}>{row.label}</span>
							<span class="count">{row.items.length}</span>
						</span>
					</div>
					<div class="rows">
						<div class="envelope" aria-hidden="true">
							{#if held}
								<span class="env" style:left="{held.left}%" style:width="{held.width}%"></span>
							{/if}
						</div>
						{#each row.items as todo (todo.id)}
							<Row {todo} plan={bar(todo.startDate, todo.dueDate)} real={actual(todo)} />
						{/each}
					</div>
				</section>
			{/each}

			<div class="now" aria-hidden="true"><span style:left="{today}%"></span></div>
		</div>
	</div>

	<div class="legend">
		<span class="item"><span class="sw sw-plan"></span>planned</span>
		<span class="item"><span class="sw sw-real"></span>actual</span>
		<span class="item"><span class="sw sw-over"></span>overdue</span>
		<span class="item"><span class="sw sw-now"></span>today</span>
		{#if unit === 'day'}
			<span class="item"><span class="sw sw-off"></span>weekend</span>
		{/if}
		<span class="range">{f.date(new Date(span.start))} – {f.date(new Date(span.end))}</span>
	</div>
{/if}

<style>
	/* Every column measure is `rem`: the axis labels shrink their own font, and an `em`
	   here would resolve against that and drift the header off the columns. */
	.wrap {
		--lane: 2.1rem;
		--name: 15rem;
		--h: 2.9rem;
		overflow: auto;
		scrollbar-width: thin;
		max-height: 70vh;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
	}

	.grid {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		padding-bottom: 0.4em;
		min-width: max(100%, calc(var(--lane) + var(--name) + var(--cols) * var(--col)));
	}

	/* Starts where the track starts, so a percent means the same instant in every layer. */
	.now {
		position: absolute;
		inset: 0 0 0 calc(var(--lane) + var(--name));
		pointer-events: none;
	}

	/* Nested inside a stage, which already begins after the rail. */
	.envelope {
		position: absolute;
		inset: 0 0 0 var(--name);
		pointer-events: none;
	}

	/* A stage is a block that wraps its own todos: rail on the left, window behind.
	   Its outline is a shadow, not a border — a border would push the track a pixel
	   off the ruling drawn behind it. */
	.stage {
		display: flex;
		align-items: stretch;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: inset 0 0 0 1px var(--border);
	}

	.lane {
		position: sticky;
		left: 0;
		z-index: 2;
		flex: 0 0 var(--lane);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 0.5rem 0;
		background: var(--surface-2);
		box-shadow: inset -1px 0 0 var(--border);
		border-radius: var(--radius) 0 0 var(--radius);
	}

	/* The name rides down its own rail, so a long stage never loses its label. */
	.pin {
		position: sticky;
		top: 3rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5em;
	}

	.tag {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		font-family: var(--font-mono);
		font-size: 0.66em;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.count {
		font-family: var(--font-mono);
		font-size: 0.62em;
		color: var(--dim);
	}

	.rows {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	/* The rows are Row instances, so their sibling border lives with their parent. */
	.rows :global(.row + .row) {
		border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
	}

	.env {
		position: absolute;
		top: 0.3em;
		bottom: 0.3em;
		border-radius: 5px;
		background: color-mix(in srgb, var(--ink) 4%, transparent);
		border-inline: 1px solid var(--border-bright);
	}

	.now span {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px dashed color-mix(in srgb, var(--accent) 65%, transparent);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em 1.1em;
		margin-top: 0.7em;
		padding: 0 0.2em;
		font-family: var(--font-mono);
		font-size: 0.7em;
		color: var(--muted);
	}

	.item {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}

	.sw {
		display: inline-block;
		width: 1.6em;
		flex-shrink: 0;
	}

	.sw-plan {
		height: 0.8em;
		border-radius: 3px;
		background: color-mix(in srgb, var(--accent) 28%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
	}

	.sw-real {
		height: 0.35em;
		border-radius: 999px;
		background: var(--accent);
	}

	.sw-over {
		height: 0.8em;
		border-radius: 3px;
		background: color-mix(in srgb, var(--danger) 28%, transparent);
		border: 1px solid color-mix(in srgb, var(--danger) 60%, transparent);
	}

	.sw-now {
		width: 0;
		height: 1em;
		border-left: 1px dashed color-mix(in srgb, var(--accent) 65%, transparent);
	}

	.sw-off {
		height: 1em;
		border-radius: 2px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
	}

	.range {
		margin-left: auto;
		color: var(--dim);
	}
</style>
