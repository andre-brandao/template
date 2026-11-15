<script lang="ts">
	import { tick } from 'svelte';
	import * as Tabs from '../tabs';
	import Popover from '../popover/Popover.svelte';
	import Calendar from './Calendar.svelte';
	import Keys from './Keys.svelte';
	import { dates } from './ctx';
	import { format, last, shift, today, valid, type Day, type Range } from './day';

	const cfg = dates();

	let {
		range = $bindable(last(30, today(cfg.zone))),
		presets = [7, 30, 90, 365],
		max,
		maxSpan = 366,
		onchange
	}: {
		range?: Range;
		/** Trailing spans in days, ending on `max`. */
		presets?: number[];
		/** The last pickable day; defaults to today in the zone. */
		max?: Day;
		maxSpan?: number;
		onchange?: (range: Range) => void;
	} = $props();

	const end = $derived(max ?? today(cfg.zone));
	const month = $derived(end.slice(0, 8) + '01');
	const extra = $derived([
		{ label: 'This month', range: { start: month, end } },
		{
			label: 'Last month',
			range: { start: shift(month, { months: -1 }), end: shift(month, { days: -1 }) }
		}
	]);

	let open = $state(false);
	let calendar: { jump(day: Day): void; reset(): void } | undefined = $state();

	const tag = (days: number) => (days === 365 ? '1y' : `${days}d`);
	const name = (days: number) => (days === 365 ? 'Last year' : `Last ${days} days`);
	const same = (a: Range, b: Range) => a.start === b.start && a.end === b.end;
	const active = (days: number) => same(range, last(days, end));
	const custom = $derived(!presets.some(active));

	const short = (day: Day) =>
		format(day, cfg.locale, {
			month: 'short',
			day: 'numeric',
			year: range.start.slice(0, 4) === range.end.slice(0, 4) ? undefined : 'numeric'
		});

	// Paint the picker itself before notifying, so consumers whose async work is
	// synchronized on the new range don't hold back the control's own feedback.
	const set = async (next: Range) => {
		range = next;
		await tick();
		onchange?.(next);
	};
</script>

<div class="picker">
	<Tabs.Root>
		{#each presets as days (days)}
			<Tabs.Item active={active(days)} onclick={() => set(last(days, end))}>{tag(days)}</Tabs.Item>
		{/each}
		<Popover
			bind:open={
				() => open,
				(next) => {
					open = next;
					if (!next) calendar?.reset();
				}
			}
			wide
			align="end"
			label="Custom range"
		>
			{#snippet trigger(attrs)}
				<Tabs.Item active={custom} {...attrs}>
					{custom ? `${short(range.start)} – ${short(range.end)}` : 'Custom'}
				</Tabs.Item>
			{/snippet}
			{#snippet children(close)}
				<div class="custom">
					<div class="side">
						{#each presets as days (days)}
							<button
								type="button"
								class={['preset', { on: active(days) }]}
								onclick={() => {
									set(last(days, end));
									close();
								}}>{name(days)}</button
							>
						{/each}
						{#each extra as one (one.label)}
							<button
								type="button"
								class={['preset', { on: same(range, one.range) }]}
								onclick={() => {
									set(one.range);
									close();
								}}>{one.label}</button
							>
						{/each}
					</div>
					<Calendar
						bind:this={calendar}
						mode="range"
						months={2}
						value={range}
						max={end}
						{maxSpan}
						autofocus
						onchange={(next) => {
							if (!valid(next, maxSpan)) return;
							set(next);
							close();
						}}
					/>
				</div>
				<Keys today={() => calendar?.jump(today(cfg.zone))} clear={() => calendar?.reset()} />
			{/snippet}
		</Popover>
	</Tabs.Root>
</div>

<style>
	.picker {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75em;
	}

	.custom {
		display: flex;
		gap: 0.6em;
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 8.5em;
		padding: 0.3em 0.6em 0.3em 0.1em;
		border-right: 1px solid var(--border);
	}

	.preset {
		padding: 0.35em 0.55em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 0.85em;
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
	}

	.preset:hover,
	.preset:focus-visible {
		background: var(--hover);
		outline: none;
	}

	.on {
		box-shadow: inset 2px 0 0 var(--accent);
	}
</style>
