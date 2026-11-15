<script lang="ts">
	import type { Snippet } from 'svelte';
	import Popover, { type Trigger } from '../popover/Popover.svelte';
	import Calendar from './Calendar.svelte';
	import Keys from './Keys.svelte';
	import { dates } from './ctx';
	import { at, format, split, today, type Day } from './day';
	import { parse } from './parse';

	let {
		value = $bindable(),
		time = false,
		name,
		placeholder = 'Date',
		label,
		clearable = false,
		presets = [],
		min,
		max,
		disabled,
		marks,
		onchange,
		trigger
	}: {
		/** A day (`YYYY-MM-DD`), or with `time` an ISO instant in the zone. */
		value?: string;
		/** Adds an optional time; a day without one stores the start of that day. */
		time?: boolean;
		/** Submits `value` through a hidden input. */
		name?: string;
		placeholder?: string;
		label?: string;
		clearable?: boolean;
		/** Typed-entry text, resolved when picked: `{ label: 'Next week', value: 'next mon' }`. */
		presets?: { label: string; value: string }[];
		min?: Day;
		max?: Day;
		disabled?: (day: Day) => boolean;
		marks?: Day[];
		onchange?: (value: string | undefined) => void;
		/** A quiet trigger in place of the field, which then moves into the popover. */
		trigger?: Snippet<[attrs: Trigger, label: string]>;
	} = $props();

	const cfg = dates();
	const day = /^\d{4}-\d{2}-\d{2}$/;

	let open = $state(false);
	let text = $state('');
	let typing = $state(false);

	// The picked day and its `HH:mm` in the zone; garbage reads as nothing.
	const parts = $derived.by(() => {
		if (!value) return;
		if (!time) return day.test(value) ? { day: value, clock: '' } : undefined;
		return Number.isNaN(Date.parse(value)) ? undefined : split(value, cfg.zone);
	});
	const shown = $derived(parts ? format(parts.day, cfg.locale, cfg.format) : '');
	const hour = $derived(
		parts?.clock ? format(parts.day, cfg.locale, { timeStyle: 'short' }, parts.clock) : ''
	);
	const preview = $derived(
		typing && text.trim() ? parse(text, { today: today(cfg.zone), locale: cfg.locale, weekStart: cfg.weekStart }) : undefined
	);

	const allowed = (one: Day) => !(min && one < min) && !(max && one > max) && !disabled?.(one);

	function emit(next: string | undefined) {
		value = next;
		onchange?.(next);
	}

	function pick(next: Day | undefined) {
		typing = false;
		if (!next) return emit(undefined);
		if (!allowed(next)) return;
		emit(time ? at(next, parts?.clock ?? '', cfg.zone) : next);
	}

	// Blur or Enter: a match commits, an empty field clears, anything else reverts.
	function commit() {
		if (!typing) return;
		// Read before `typing` drops: the preview derives from it and goes blank after.
		const next = preview;
		typing = false;
		if (!text.trim() && clearable) return pick(undefined);
		if (next) pick(next);
	}

	function key(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commit();
			if (trigger) open = false;
		}
		if (e.key === 'Escape' && typing) {
			e.stopPropagation();
			typing = false;
		}
	}
</script>

{#snippet field(focus: boolean)}
	<span class="entry">
		<!-- svelte-ignore a11y_autofocus -->
		<input
			class="text"
			value={typing ? text : shown}
			{placeholder}
			aria-label={label ?? placeholder}
			autocomplete="off"
			autofocus={focus}
			oninput={(e) => {
				text = e.currentTarget.value;
				typing = true;
			}}
			onblur={commit}
			onkeydown={key}
		/>
		{#if typing && text.trim()}
			<span class={['preview', { miss: !preview }]} aria-live="polite">
				{preview
					? format(preview, cfg.locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
					: 'No match'}
			</span>
		{/if}
	</span>
	{#if time}
		<input
			class="time"
			type="time"
			aria-label="Time"
			value={parts?.clock ?? ''}
			onchange={(e) => emit(at(parts?.day ?? today(cfg.zone), e.currentTarget.value, cfg.zone))}
		/>
	{/if}
{/snippet}

{#snippet panel(close: () => void)}
	{#if trigger}
		<div class="field inner">{@render field(true)}</div>
	{/if}
	{#if presets.length}
		<div class="presets">
			{#each presets as one (one.label)}
				<button
					type="button"
					class="preset"
					onclick={() => {
						pick(parse(one.value, { today: today(cfg.zone), locale: cfg.locale, weekStart: cfg.weekStart }));
						close();
					}}>{one.label}</button
				>
			{/each}
		</div>
	{/if}
	<Calendar
		value={parts?.day}
		{min}
		{max}
		{disabled}
		{marks}
		autofocus={!trigger}
		onchange={(next) => {
			pick(next);
			// With the time field in here too, stay open so it can be set next.
			if (!(time && trigger)) close();
		}}
	/>
	<Keys
		today={() => {
			pick(today(cfg.zone));
			close();
		}}
		clear={clearable
			? () => {
					pick(undefined);
					close();
				}
			: undefined}
	/>
{/snippet}

{#snippet icon(attrs: Trigger)}
	<button type="button" class="icon" aria-label="Open calendar" {...attrs}>
		<svg viewBox="0 0 16 16" aria-hidden="true">
			<rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
			<path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
		</svg>
	</button>
{/snippet}

{#snippet quiet(attrs: Trigger)}
	{@render trigger?.(attrs, [shown, hour].filter(Boolean).join(' '))}
{/snippet}

{#if trigger}
	<Popover bind:open label={label ?? placeholder} trigger={quiet}>
		{#snippet children(close)}{@render panel(close)}{/snippet}
	</Popover>
{:else}
	<span class="field">
		{@render field(false)}
		{#if clearable && value}
			<button type="button" class="icon" aria-label="Clear" onclick={() => pick(undefined)}>
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7" /></svg>
			</button>
		{/if}
		<Popover bind:open align="end" label={label ?? placeholder} trigger={icon}>
			{#snippet children(close)}{@render panel(close)}{/snippet}
		</Popover>
	</span>
{/if}
{#if name}<input type="hidden" {name} value={value ?? ''} />{/if}

<style>
	.field {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;
		min-height: 2.25em;
		padding: 0 0.25em 0 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		box-shadow: var(--shadow-1);
	}

	.field:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 16%, transparent);
	}

	.inner {
		display: flex;
		margin: 0.2em 0.2em 0.4em;
	}

	.entry {
		position: relative;
		display: flex;
		flex: 1;
		align-items: center;
		min-width: 0;
	}

	input {
		min-width: 0;
		border: none;
		background: none;
		color: var(--ink);
		font: inherit;
		outline: none;
	}

	.text {
		flex: 1;
		width: 9em;
		padding: 0.4em 0.6em;
	}

	.text::placeholder {
		color: var(--dim);
	}

	.time {
		flex: none;
		width: 6.5em;
		padding: 0.4em 0.2em;
		border-left: 1px solid var(--border);
		padding-left: 0.5em;
	}

	.preview {
		flex: none;
		padding-right: 0.4em;
		color: var(--muted);
		font-size: 0.8em;
		white-space: nowrap;
	}

	.miss {
		color: var(--danger);
	}

	.icon {
		display: grid;
		flex: none;
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

	.icon:hover {
		background: var(--hover);
		color: var(--ink);
	}

	.icon svg {
		width: 1em;
		height: 1em;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linecap: round;
	}

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em;
		padding: 0.2em 0.3em 0.3em;
	}

	.preset {
		padding: 0.2em 0.55em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 0.8em;
		cursor: pointer;
	}

	.preset:hover {
		background: var(--hover);
	}
</style>
