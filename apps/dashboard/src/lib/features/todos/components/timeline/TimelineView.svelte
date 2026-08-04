<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { group, type By } from '../../group';
	import { color, label, late } from '../../status';

	let { todos, by = 'stage' }: { todos: Todo.Info[]; by?: By } = $props();

	const DAY = 86_400_000;
	const me = user();
	const f = fmt();

	const rows = $derived(group(todos, by));

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
	const unit = $derived(!span ? 'day' : span.days <= 56 ? 'day' : span.days <= 240 ? 'week' : 'month');

	const short = $derived(
		new Intl.DateTimeFormat(me.prefs.locale ?? undefined, { month: 'short', day: 'numeric' })
	);
	const month = $derived(
		new Intl.DateTimeFormat(me.prefs.locale ?? undefined, { month: 'short', year: '2-digit' })
	);

	const ticks = $derived.by(() => {
		if (!span) return [];
		const out: { at: number; text: string }[] = [];
		const cursor = new Date(span.start);
		if (unit === 'week') cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7));
		if (unit === 'month') cursor.setUTCDate(1);
		while (cursor.getTime() <= span.end) {
			const at = cursor.getTime();
			if (at >= span.start)
				out.push({ at, text: unit === 'month' ? month.format(at) : short.format(at) });
			if (unit === 'month') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
			else cursor.setUTCDate(cursor.getUTCDate() + (unit === 'week' ? 7 : 1));
		}
		return out;
	});

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

	function band(items: Todo.Info[]) {
		const all = items.flatMap((todo) => [todo.startDate, todo.dueDate]).filter((at) => at !== null);
		if (all.length === 0) return null;
		const sorted = all.map(Date.parse).sort((a, b) => a - b);
		return bar(new Date(sorted[0]!).toISOString(), new Date(sorted.at(-1)!).toISOString());
	}

	const today = $derived(pct(Date.now()));
</script>

{#if !span}
	<p class="empty">Give todos a start or due date to see them on the cronograma.</p>
{:else}
	<div class="wrap">
		<div class="chart" style:--cols={ticks.length}>
			<div class="cell head corner"></div>
			<div class="cell head axis">
				{#each ticks as tick (tick.at)}
					<span class="tick" style:left="{pct(tick.at)}%">{tick.text}</span>
				{/each}
				<span class="today" style:left="{today}%"></span>
			</div>

			{#each rows as row (row.key)}
				{@const width = band(row.items)}
				<div class="cell name group">{row.label}</div>
				<div class="cell track group">
					<span class="today" style:left="{today}%"></span>
					{#if width}
						<span class="band" style:left="{width.left}%" style:width="{width.width}%"></span>
					{/if}
				</div>

				{#each row.items as todo (todo.id)}
					{@const plan = bar(todo.startDate, todo.dueDate)}
					{@const real = actual(todo)}
					<div class="cell name">
						<a href="/todos/{todo.id}">{todo.title}</a>
						<small>{todo.assignee?.name ?? 'Unassigned'}</small>
					</div>
					<div class="cell track">
						<span class="today" style:left="{today}%"></span>
						{#if plan}
							<span
								class="plan"
								class:late={late(todo)}
								style:left="{plan.left}%"
								style:width="{plan.width}%"
								style:--c={color(todo.status)}
								title="{label(todo.status)} · {todo.startDate ? f.date(todo.startDate) : '?'} → {todo.dueDate
									? f.date(todo.dueDate)
									: '?'}"
							></span>
						{/if}
						{#if real}
							<span
								class="real"
								style:left="{real.left}%"
								style:width="{real.width}%"
								style:--c={color(todo.status)}
								title="Started {f.date(todo.timeStarted!)}{todo.timeDone
									? ` · done ${f.date(todo.timeDone)}`
									: ''}"
							></span>
						{/if}
						{#if !plan && !real}
							<span class="undated">no dates</span>
						{/if}
					</div>
				{/each}
			{/each}
		</div>
	</div>

	<p class="legend">
		<span class="key plan"></span> planned
		<span class="key real"></span> actual
		<span class="key line"></span> today
	</p>
{/if}

<style>
	.wrap {
		overflow-x: auto;
		scrollbar-width: thin;
		border: 1px solid var(--border);
		border-radius: 8px;
		max-height: 65vh;
		overflow-y: auto;
	}

	.chart {
		display: grid;
		grid-template-columns: minmax(11em, 14em) 1fr;
		align-items: stretch;
		min-width: max(100%, calc(14em + var(--cols) * 2.6em));
	}

	.cell {
		border-bottom: 1px solid var(--border);
		min-height: 2.1em;
	}

	.head {
		position: sticky;
		top: 0;
		z-index: 2;
		background: var(--surface-2);
	}

	.name {
		position: sticky;
		left: 0;
		z-index: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.15em;
		padding: 0.35em 0.75em;
		background: var(--surface);
		border-right: 1px solid var(--border);
		overflow: hidden;
	}

	.corner {
		z-index: 3;
		border-right: 1px solid var(--border);
	}

	.name a {
		color: var(--ink);
		text-decoration: none;
		font-size: 0.88em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.name a:hover {
		color: var(--accent);
	}

	.name small {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.68em;
	}

	.group {
		background: var(--surface-2);
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.axis,
	.track {
		position: relative;
	}

	.tick {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		padding-left: 0.35em;
		border-left: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 0.68em;
		color: var(--dim);
		white-space: nowrap;
	}

	.today {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 0;
		border-left: 1px dashed color-mix(in srgb, var(--accent) 70%, transparent);
	}

	.band {
		position: absolute;
		top: 0.4em;
		bottom: 0.4em;
		border-radius: 4px;
		background: color-mix(in srgb, var(--ink) 7%, transparent);
		border: 1px solid var(--border);
	}

	.plan {
		position: absolute;
		top: 0.45em;
		height: 1.1em;
		border-radius: 4px;
		background: color-mix(in srgb, var(--c) 28%, transparent);
		border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
	}

	.plan.late {
		background: color-mix(in srgb, var(--danger) 28%, transparent);
		border-color: color-mix(in srgb, var(--danger) 60%, transparent);
	}

	.real {
		position: absolute;
		top: 0.95em;
		height: 0.4em;
		border-radius: 999px;
		background: var(--c);
	}

	.undated {
		position: absolute;
		left: 0.6em;
		top: 50%;
		transform: translateY(-50%);
		font-family: var(--font-mono);
		font-size: 0.68em;
		color: var(--dim);
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin: 0.6em 0 0;
		font-family: var(--font-mono);
		font-size: 0.7em;
		color: var(--dim);
	}

	.key {
		display: inline-block;
		width: 1.4em;
		margin-left: 0.8em;
	}

	.key.plan {
		position: static;
		height: 0.8em;
		border-radius: 3px;
		background: color-mix(in srgb, var(--accent) 28%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
	}

	.key.real {
		position: static;
		height: 0.35em;
		border-radius: 999px;
		background: var(--accent);
	}

	.key.line {
		height: 0.9em;
		width: 0;
		border-left: 1px dashed color-mix(in srgb, var(--accent) 70%, transparent);
	}

	.empty {
		color: var(--dim);
		font-size: 0.9em;
		margin: 0.5em 0.2em;
	}
</style>
