<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { group, type By } from '../../group';
	import { color, label, late } from '../../status';
	import { peek } from '$lib/utils/peek';

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
		const out: { at: number; text: string; major: boolean; off: boolean }[] = [];
		const cursor = new Date(span.start);
		if (unit === 'week') cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 6) % 7));
		if (unit === 'month') cursor.setUTCDate(1);
		while (cursor.getTime() <= span.end) {
			const time = cursor.getTime();
			const day = cursor.getUTCDay();
			if (time >= span.start)
				out.push({
					at: time,
					text: unit === 'month' ? month.format(time) : short.format(time),
					major: unit !== 'day' || day === 1,
					off: unit === 'day' && (day === 0 || day === 6)
				});
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
	<p class="empty">Give a todo a start or due date and it lands on the cronograma.</p>
{:else}
	<div class="wrap">
		<div class="grid" style:--cols={ticks.length} style:--col={col}>
			<!-- One ruling for the whole chart, so the calendar reads through the group gaps. -->
			<div class="field" aria-hidden="true">
				{#each ticks as tick (tick.at)}
					{#if tick.off}
						<span class="off" style:left="{pct(tick.at)}%" style:width="{100 / span.days}%"></span>
					{/if}
					<span class="line" class:major={tick.major} style:left="{pct(tick.at)}%"></span>
				{/each}
			</div>

			<div class="axis">
				<div class="corner">{todos.length} todos</div>
				<div class="scale">
					{#each ticks as tick (tick.at)}
						{#if tick.major}
							<span class="tick" style:left="{pct(tick.at)}%">{tick.text}</span>
						{/if}
					{/each}
					<span class="cap" style:left="{today}%"><span></span></span>
				</div>
			</div>

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
							{@const plan = bar(todo.startDate, todo.dueDate)}
							{@const real = actual(todo)}
							<div class="row">
								<div class="name">
									<a href="/todos/{todo.id}" onclick={peek({ selected: todo.id })}>{todo.title}</a>
									<small>{todo.assignee?.name ?? 'Unassigned'}</small>
								</div>
								<div class="track">
									{#if plan}
										<span
											class="plan"
											class:late={late(todo)}
											style:left="{plan.left}%"
											style:width="{plan.width}%"
											style:--c={color(todo.status)}
											title="{label(todo.status)} · {todo.startDate
												? f.date(todo.startDate)
												: '?'} → {todo.dueDate ? f.date(todo.dueDate) : '?'}"
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
							</div>
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

	/* Overlays and the scale all start where the track starts, so a percent means the
	   same instant in every layer. */
	.field,
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

	.line {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
	}

	.line.major {
		border-left-color: var(--border);
	}

	.off {
		position: absolute;
		top: 0;
		bottom: 0;
		background: color-mix(in srgb, var(--ink) 3.5%, transparent);
	}

	.axis {
		position: sticky;
		top: 0;
		z-index: 4;
		display: flex;
		align-items: stretch;
		height: 2.4rem;
		background: var(--surface-2);
		border-bottom: 1px solid var(--border-bright);
	}

	.corner {
		position: sticky;
		left: 0;
		z-index: 5;
		flex: 0 0 calc(var(--lane) + var(--name));
		display: flex;
		align-items: center;
		padding: 0 0.85rem;
		background: var(--surface-2);
		box-shadow: inset -1px 0 0 var(--border-bright);
		font-family: var(--font-mono);
		font-size: 0.7em;
		letter-spacing: 0.04em;
		color: var(--dim);
	}

	.scale {
		position: relative;
		flex: 1;
	}

	.tick {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		padding-left: 0.4em;
		border-left: 1px solid var(--border-bright);
		font-family: var(--font-mono);
		font-size: 0.68em;
		color: var(--muted);
		white-space: nowrap;
	}

	.cap {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px solid var(--accent);
	}

	.cap span {
		position: absolute;
		bottom: -3px;
		left: -3px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent);
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

	.env {
		position: absolute;
		top: 0.3em;
		bottom: 0.3em;
		border-radius: 5px;
		background: color-mix(in srgb, var(--ink) 4%, transparent);
		border-inline: 1px solid var(--border-bright);
	}

	.row {
		display: flex;
		align-items: stretch;
		height: var(--h);
	}

	.row + .row {
		border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
	}

	.name {
		position: sticky;
		left: var(--lane);
		z-index: 1;
		flex: 0 0 var(--name);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.15em;
		padding: 0 0.85rem;
		background: var(--surface);
		box-shadow: inset -1px 0 0 var(--border);
		overflow: hidden;
	}

	.row:hover .name {
		background: var(--surface-2);
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

	.track {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.plan {
		position: absolute;
		top: calc(var(--h) / 2 - 0.85em);
		height: 0.9em;
		border-radius: 3px;
		background: color-mix(in srgb, var(--c) 28%, transparent);
		border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
	}

	.plan.late {
		background: color-mix(in srgb, var(--danger) 28%, transparent);
		border-color: color-mix(in srgb, var(--danger) 60%, transparent);
	}

	.real {
		position: absolute;
		top: calc(var(--h) / 2 + 0.2em);
		height: 0.35em;
		border-radius: 999px;
		background: var(--c);
	}

	.undated {
		position: absolute;
		left: 0.7em;
		top: 50%;
		transform: translateY(-50%);
		font-family: var(--font-mono);
		font-size: 0.66em;
		color: var(--dim);
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

	.empty {
		color: var(--dim);
		font-size: 0.9em;
		margin: 0.5em 0.2em;
	}
</style>
