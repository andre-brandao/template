<script module lang="ts">
	import type { Todo } from '@template/core/todo';
	import type { Day, State } from '@template/ui';
	import type { Kind } from './drag.svelte';
	import type { Item } from './layout';

	export type Mode = 'month' | 'week';

	/** What every chip on the calendar needs from the view that owns the drag and the save. */
	export type Chips = {
		grab: (e: PointerEvent, todo: Todo.Info, kind?: Kind) => void;
		open: (id: string) => void;
		mark: (id: string) => { state: State; message?: string };
		time: (item: Item) => string;
		hour: (minute: number) => string;
	};

	export type Change = { mode?: Mode; at?: Day };
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { goto, pushState } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey, setHotkeysContext } from '@tanstack/svelte-hotkeys';
	import { hotkeys } from '$lib/hotkeys';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import {
		Issue,
		Kbd,
		Popover,
		Status,
		Tabs,
		at as instant,
		format,
		fromDay,
		modal,
		shift,
		today,
		week,
		weekStart
	} from '@template/ui';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { between, undated, update } from '../../api/todos.query';
	import TodoForm from '../form/TodoForm.svelte';
	import Chip from './Chip.svelte';
	import Month from './Month.svelte';
	import Week from './Week.svelte';
	import Tray from './Tray.svelte';
	import Quick from './Quick.svelte';
	import { createDrag } from './drag.svelte';
	import { apply, clock, item, resize, same, slide, type Spot } from './layout';

	let {
		filters,
		mode: initial = 'month',
		at,
		keep = () => true,
		onchange
	}: {
		filters: Parameters<typeof undated>[0];
		/** Narrows what came back, for the multi-valued filters the API can't take. */
		keep?: (todo: Todo.Info) => boolean;
		mode?: Mode;
		at?: Day;
		onchange: (next: Change) => void;
	} = $props();

	const me = user();
	const f = fmt();
	setHotkeysContext({ scope: 'calendar' });

	// Local state leads: the URL lands after the fetch, and the grid must move on the keypress.
	let mode = $state(untrack(() => initial));
	let focus = $state(untrack(() => at ?? today(f.zone)));
	let shown = $state(untrack(() => focus));

	const start = $derived(weekStart(me.prefs.locale));
	const first = $derived(
		mode === 'month' ? week(shown.slice(0, 8) + '01', start) : week(focus, start)
	);
	const last = $derived(shift(first, { days: mode === 'month' ? 41 : 6 }));

	// A day of slack each side, so legacy UTC-midnight dates west or east of UTC still land.
	const dated = createQuery(() =>
		between({
			...filters,
			from: new Date(fromDay(shift(first, { days: -1 }), f.zone)).toISOString(),
			to: new Date(Date.parse(fromDay(shift(last, { days: 2 }), f.zone)) - 1).toISOString()
		})
	);
	const loose = createQuery(() => undated(filters));

	const items = $derived(
		(dated.data?.data ?? [])
			.filter(keep)
			.map((todo) => item(todo, f.zone))
			.filter((one) => one !== undefined)
	);

	const save = update();
	const pending = new SvelteSet<string>();
	const failed = new SvelteMap<string, string>();
	let more: ReturnType<typeof Popover> | undefined = $state();
	let picked: Day | undefined = $state();

	const patch = (todo: Todo.Info, kind: Kind, origin: Spot | undefined, to: Spot) =>
		kind === 'resize' ? resize(todo, to, f.zone) : slide(todo, origin, to, f.zone);

	const drag = createDrag((todo, kind, origin, to) => {
		const body = patch(todo, kind, origin, to);
		if (same(todo, body)) return;
		more?.close();
		pending.add(todo.id);
		failed.delete(todo.id);
		save
			.mutateAsync({ path: { id: todo.id }, body })
			.catch((err: Error) => failed.set(todo.id, err.message))
			.finally(() => pending.delete(todo.id));
	});

	const preview = $derived(
		drag.active && drag.over
			? item(
					apply(
						drag.active.todo,
						patch(drag.active.todo, drag.active.kind, drag.active.origin, drag.over)
					),
					f.zone
				)
			: undefined
	);
	const hit = (day: Day) => !!preview && preview.start <= day && day <= preview.end;

	const chips: Chips = {
		grab: drag.grab,
		open: (id) => {
			if (innerWidth < 640) return goto(`/todos/${id}`);
			pushState(`/todos/${id}`, { selected: id });
		},
		mark: (id) =>
			pending.has(id)
				? { state: 'pending' }
				: failed.has(id)
					? { state: 'failed', message: failed.get(id) }
					: { state: 'idle' },
		time: (one) => {
			if (one.from) return f.time(one.todo.startDate ?? one.todo.dueDate ?? '');
			return one.until && one.todo.dueDate ? f.time(one.todo.dueDate) : '';
		},
		hour: (minute) => f.time(instant(focus, clock(minute), f.zone))
	};

	const key = (day: Day) => (mode === 'month' ? day.slice(0, 7) : week(day, start));

	/** Jumps the view to a day, and the URL with it. */
	function go(day: Day) {
		focus = day;
		shown = day;
		onchange({ at: day });
	}

	// Grid-driven focus: the month only follows once the day leaves the six visible weeks.
	function set(day: Day) {
		const moved = mode === 'month' ? day < first || day > last : key(day) !== key(focus);
		focus = day;
		if (!moved) return;
		shown = day;
		onchange({ at: day });
	}

	const step = (n: number) =>
		go(shift(mode === 'month' ? shown : focus, mode === 'month' ? { months: n } : { weeks: n }));

	function swap(next: Mode) {
		if (next === mode) return;
		mode = next;
		shown = focus;
		onchange({ mode: next, at: focus });
	}

	const create = (day: Day) =>
		modal(TodoForm, { scope: { source: filters.source, sourceID: filters.sourceID }, due: day });

	let quick: Quick | undefined = $state();

	// Enter on a day is a click with no pointer (`detail` 0), so it opens under that day.
	function add(day: Day, e: MouseEvent) {
		const box =
			e.target instanceof Element ? e.target.closest('button')?.getBoundingClientRect() : undefined;
		quick?.open(
			day,
			!e.detail && box ? { x: box.left, y: box.bottom } : { x: e.clientX, y: e.clientY }
		);
	}

	function list(day: Day, e: MouseEvent) {
		picked = day;
		more?.show({ x: e.clientX, y: e.clientY });
	}

	createHotkey(hotkeys.today, () => go(today(f.zone)));
	createHotkey(hotkeys.back, () => step(-1));
	createHotkey(hotkeys.next, () => step(1));
	createHotkey(hotkeys.month, () => swap('month'));
	createHotkey(hotkeys.week, () => swap('week'));

	const title = $derived(
		mode === 'month'
			? format(shown, me.prefs.locale, { month: 'long', year: 'numeric' })
			: `${format(first, me.prefs.locale, { month: 'short', day: 'numeric' })} – ${format(last, me.prefs.locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
	);
</script>

<div class="calendar">
	<div class="bar">
		<div class="nav">
			<button type="button" class="icon" aria-label="Previous {mode}" onclick={() => step(-1)}>
				<ChevronLeft size={15} strokeWidth={1.75} />
			</button>
			<button type="button" class="today" onclick={() => go(today(f.zone))}>Today</button>
			<button type="button" class="icon" aria-label="Next {mode}" onclick={() => step(1)}>
				<ChevronRight size={15} strokeWidth={1.75} />
			</button>
		</div>
		<h2>{title}</h2>
		{#if dated.isFetching}<Status state="pending" />{/if}
		{#if dated.data && dated.data.total > dated.data.data.length}
			<span class="note">{dated.data.data.length} of {dated.data.total} shown</span>
		{/if}
		<span class="keys">
			<span><Kbd keys="T" /> today</span>
			<span><Kbd keys="[" /><Kbd keys="]" /> {mode}</span>
			<span><Kbd keys="M" /><Kbd keys="W" /> mode</span>
		</span>
		<Tabs.Root>
			<Tabs.Item active={mode === 'month'} onclick={() => swap('month')}>Month</Tabs.Item>
			<Tabs.Item active={mode === 'week'} onclick={() => swap('week')}>Week</Tabs.Item>
		</Tabs.Root>
	</div>

	{#if dated.isError}<Issue>{dated.error.message}</Issue>{/if}

	<div class={['body', { dragging: !!drag.active }]}>
		{#if mode === 'month'}
			<Month
				month={shown}
				bind:focus={() => focus, set}
				{start}
				{items}
				{hit}
				{chips}
				onpick={add}
				onmore={list}
			/>
		{:else}
			<Week
				bind:focus={() => focus, set}
				{start}
				locale={me.prefs.locale}
				zone={f.zone}
				{items}
				{hit}
				{preview}
				{chips}
				onpick={add}
			/>
		{/if}
		<Tray
			todos={(loose.data?.data ?? []).filter(keep)}
			total={loose.data?.total}
			loading={loose.isPending}
			{chips}
		/>
	</div>
</div>

<Quick
	bind:this={quick}
	scope={{ source: filters.source, sourceID: filters.sourceID }}
	onmore={create}
/>

<Popover bind:this={more} label="Todos on this day">
	{#if picked}
		{@const day = picked}
		<div class="list">
			<p>{format(day, me.prefs.locale, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
			{#each items.filter((one) => one.start <= day && day <= one.end) as one (one.todo.id)}
				<Chip
					todo={one.todo}
					time={chips.time(one)}
					link
					{...chips.mark(one.todo.id)}
					grab={chips.grab}
					open={chips.open}
				/>
			{/each}
		</div>
	{/if}
</Popover>

{#if drag.active}
	<div class="drag" style:left="{drag.x + 12}px" style:top="{drag.y + 10}px">
		{drag.active.kind === 'resize' ? 'Due' : 'Move'} · {drag.active.todo.title}
	</div>
{/if}

<style>
	.calendar {
		display: grid;
		gap: 0.6rem;
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 0.75rem;
	}

	.nav {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	.nav button {
		display: inline-grid;
		place-items: center;
		min-height: 1.9rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--muted);
		font: inherit;
		font-size: 0.82em;
		cursor: pointer;
	}

	.nav button:hover {
		color: var(--ink);
		background: var(--hover);
	}

	.icon {
		width: 1.9rem;
	}

	.today {
		padding: 0 0.7rem;
	}

	h2 {
		margin: 0;
		font-size: 1em;
		font-weight: 600;
		text-transform: capitalize;
	}

	.note {
		color: var(--dim);
		font-size: 0.75em;
	}

	.keys {
		display: inline-flex;
		gap: 0.8rem;
		margin-left: auto;
		color: var(--dim);
		font-size: 0.72rem;
	}

	.keys span {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
	}

	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 14rem;
		align-items: start;
		gap: 0.6rem;
	}

	.dragging {
		cursor: grabbing;
		user-select: none;
	}

	@media (max-width: 900px) {
		.body {
			grid-template-columns: minmax(0, 1fr);
		}

		.keys {
			display: none;
		}
	}

	.list {
		display: grid;
		gap: 3px;
		min-width: 14rem;
		padding: 0.25rem;
	}

	.list p {
		margin: 0 0 0.25rem;
		color: var(--muted);
		font-size: 0.78rem;
		font-weight: 500;
	}

	.drag {
		position: fixed;
		z-index: 100;
		max-width: 16rem;
		padding: 0.2rem 0.5rem;
		overflow: hidden;
		border: 1px solid var(--border-bright);
		border-radius: var(--radius-sm);
		background: var(--surface);
		box-shadow: var(--shadow-2);
		color: var(--ink);
		font-size: 0.75em;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: none;
	}
</style>
