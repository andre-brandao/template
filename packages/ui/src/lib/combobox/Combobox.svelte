<script module lang="ts">
	import type { Snippet } from 'svelte';

	/** What an `item` snippet gets beside its item. `marked` renders a string with the query's hits. */
	export type Row = { active: boolean; selected: boolean; marked: Snippet<[string]> };
</script>

<!--
	A picker over data: a trigger, then a search box over grouped rows on a Popover. Focus
	stays in the search box and the arrows move `aria-activedescendant`, as in `Command`.
-->
<script lang="ts" generics="T">
	import { tick } from 'svelte';
	import Popover, { type Trigger } from '../popover/Popover.svelte';
	import type { Place } from '../popover/place';
	import Chips from './Chips.svelte';
	import { bucket, mark, step, words } from '../command/model';

	let {
		items,
		key,
		text = key,
		group,
		facet,
		value = $bindable(),
		open = $bindable(false),
		query = $bindable(''),
		filter = $bindable(''),
		label = 'Options',
		placeholder = 'Search',
		disabled = false,
		caret = true,
		side = 'bottom',
		onchange,
		trigger: face,
		item,
		filters,
		empty,
		foot
	}: {
		items: T[];
		key: (item: T) => string;
		/** What the search matches; defaults to `key`. */
		text?: (item: T) => string;
		/** Rows sit under a sticky header per group, in first-seen order. */
		group?: (item: T) => string;
		/** Draws a chip row from these names, each with its count under the current query. */
		facet?: (item: T) => string;
		value?: string;
		open?: boolean;
		/** Bindable so a caller can widen `items` while something is typed. */
		query?: string;
		/** The chosen chip; empty for all. */
		filter?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		caret?: boolean;
		side?: Place;
		onchange?: (value: string) => void;
		trigger?: Snippet<[T | undefined]>;
		item?: Snippet<[T, Row]>;
		/** Extra controls at the end of the chip row. */
		filters?: Snippet;
		empty?: Snippet;
		foot?: Snippet;
	} = $props();

	const id = $props.id();

	let active = $state(0);
	let list: HTMLDivElement | undefined = $state();
	let pop: Popover | undefined = $state();

	const terms = $derived(words(query));
	const current = $derived(items.find((one) => key(one) === value));
	const title = $derived(current ? text(current) : '');
	const matched = $derived(items.filter((one) => mark(text(one), terms)));
	// Every item's name, sorted, so the chips hold still while the counts and the order move.
	const facets = $derived.by(() => {
		if (!facet) return [];
		const counts = new Map(bucket(matched, facet).map((one) => [one.name, one.items.length]));
		return [...new Set(items.map(facet))]
			.sort((a, b) => a.localeCompare(b))
			.map((name) => ({ name, count: counts.get(name) ?? 0 }));
	});
	const scope = $derived(facets.some((one) => one.name === filter) ? filter : '');
	const shown = $derived(
		facet && scope ? matched.filter((one) => facet(one) === scope) : matched
	);
	const groups = $derived(bucket(shown, (one) => group?.(one) ?? ''));
	// Display order, which is what the arrow keys walk.
	const order = $derived(groups.flatMap((one) => one.items));
	const index = $derived(new Map(order.map((one, i) => [one, i])));
	const at = $derived(Math.min(active, order.length - 1));

	function reveal() {
		tick().then(() =>
			list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
		);
	}

	// Every open and close goes through here, the platform's own light dismiss included.
	function set(next: boolean) {
		open = next;
		if (!next) {
			query = '';
			return;
		}
		active = Math.max(0, order.findIndex((one) => key(one) === value));
		// The rows mount after the platform placed an empty panel; place it again at full size.
		tick().then(() => pop?.show());
		reveal();
	}

	function choose(one: T | undefined) {
		if (!one) return;
		value = key(one);
		onchange?.(key(one));
		// Hide while the input still holds focus, so the platform hands it back to the trigger.
		pop?.close();
		open = false;
	}

	function pick(name: string) {
		filter = name;
		active = 0;
	}

	function keys(e: KeyboardEvent) {
		if (e.isComposing) return;
		const next = step(e.key, at, order.length);
		if (next !== undefined) {
			e.preventDefault();
			active = next;
			reveal();
			return;
		}
		if (e.key !== 'Enter') return;
		e.preventDefault();
		choose(order[at]);
	}

	// Arrows open it, and a printable key opens it already searching for that key.
	function press(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			open = true;
			return;
		}
		if (e.key.length !== 1 || e.key === ' ' || e.ctrlKey || e.metaKey || e.altKey) return;
		e.preventDefault();
		query = e.key;
		open = true;
	}

</script>

<!-- Marks whichever words hit this string; the row may have matched on another. -->
{#snippet marked(str: string)}
	{#each mark(str, terms.filter((word) => mark(str, [word]))) ?? [] as part, i (i)}
		{#if part.hit}<mark>{part.text}</mark>{:else}{part.text}{/if}
	{/each}
{/snippet}

{#snippet bar()}
	<div class="chips">
		{#if facets.length > 1}
			<Chips {facets} total={matched.length} {scope} onpick={pick} />
		{/if}
		{@render filters?.()}
	</div>
{/snippet}

{#snippet option(row: T, i: number)}
	{@const selected = key(row) === value}
	<!-- Pointer only: the keyboard drives the same rows through the input. -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="option"
		id="{id}-{i}"
		role="option"
		tabindex="-1"
		aria-selected={i === at}
		data-current={selected || undefined}
		onpointermove={() => (active = i)}
		onclick={() => choose(row)}
	>
		<span class="body">
			{#if item}
				{@render item(row, { active: i === at, selected, marked })}
			{:else}
				{@render marked(text(row))}
			{/if}
		</span>
		{#if selected}<span class="check" aria-hidden="true">✓</span>{/if}
	</div>
{/snippet}

{#snippet none()}
	<div class="empty">
		{#if scope && matched.length}
			Nothing in {scope}.
			<button type="button" class="all" onclick={() => pick('')}>
				Search all {matched.length}
			</button>
		{:else if empty}
			{@render empty()}
		{:else}
			No matches
		{/if}
	</div>
{/snippet}

{#snippet button(attrs: Trigger)}
	<button
		type="button"
		class="trigger"
		{...attrs}
		aria-label="{label}: {title || 'none'}"
		{disabled}
		onkeydown={press}
	>
		<span class="value">
			{#if face}{@render face(current)}{:else}{title || label}{/if}
		</span>
		{#if caret}<span class="caret" aria-hidden="true">▾</span>{/if}
	</button>
{/snippet}

{#snippet section(one: { name: string; items: T[] }, g: number)}
	<div role="group" aria-labelledby={one.name ? `${id}-g${g}` : undefined}>
		{#if one.name}<p class="head" id="{id}-g{g}">{one.name}</p>{/if}
		{#each one.items as row (key(row))}
			{@render option(row, index.get(row) ?? 0)}
		{/each}
	</div>
{/snippet}

{#snippet panel()}
	<div class="box">
		<input
			class="search"
			type="text"
			role="combobox"
			autocomplete="off"
			spellcheck="false"
			aria-label={placeholder}
			aria-expanded="true"
			aria-autocomplete="list"
			aria-controls="{id}-list"
			aria-activedescendant={order.length ? `${id}-${at}` : undefined}
			{placeholder}
			bind:value={query}
			oninput={() => (active = 0)}
			onkeydown={keys}
			{@attach (el) => {
				// Past the key that opened it, if one did.
				el.focus();
				el.setSelectionRange(el.value.length, el.value.length);
			}}
		/>
		{#if facets.length > 1 || filters}{@render bar()}{/if}
		<div class="list" id="{id}-list" role="listbox" aria-label={label} bind:this={list}>
			{#each groups as one, g (one.name)}
				{@render section(one, g)}
			{:else}
				{@render none()}
			{/each}
		</div>
		{#if foot}<div class="foot">{@render foot()}</div>{/if}
	</div>
{/snippet}

<div class="combobox">
	<Popover bind:this={pop} bind:open={() => open, set} {side} {label} trigger={button}>
		<!-- Mounted only while open, so a closed picker costs one button. -->
		{#if open}{@render panel()}{/if}
	</Popover>
</div>

<style>
	/* Layout-neutral, so the trigger sits in the caller's flex row; the var reaches the panel. */
	.combobox {
		display: contents;
		--popover-max-width: 27rem;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		min-width: 0;
		width: 100%;
		box-sizing: border-box;
		min-height: var(--control, 2.25em);
		padding: 0.25em 0.55em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		color: var(--ink, #1c1b19);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.trigger:hover:not(:disabled) {
		border-color: var(--border-bright, #d3d1cc);
	}

	.trigger:focus-visible {
		border-color: var(--accent, #2f7f68);
		outline: none;
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
	}

	.trigger:disabled {
		color: var(--dim, #75736d);
		cursor: default;
	}

	.value {
		display: flex;
		align-items: center;
		gap: 0.35em;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.caret {
		margin-inline-start: auto;
		color: var(--dim, #75736d);
		font-size: 0.8em;
	}

	.box {
		display: flex;
		flex-direction: column;
		width: min(26rem, calc(100vw - 2rem));
		/* Root-relative: a small trigger in a toolbar shouldn't shrink the panel with it. */
		font-size: 0.875rem;
	}

	.search {
		padding: 0.55em 0.6em;
		border: none;
		border-bottom: 1px solid var(--border, #e6e5e1);
		background: none;
		color: inherit;
		font: inherit;
		outline: none;
	}

	.search::placeholder {
		color: var(--dim, #75736d);
	}

	.chips {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.4em 0.3em;
		border-bottom: 1px solid var(--border, #e6e5e1);
	}

	.list {
		/* Fixed, so a panel opened upward keeps its edge on the trigger as results shrink. */
		height: min(17rem, 45vh);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0.25em 0.1em;
		/* Room for the sticky header, so a row scrolled up to never hides beneath it. */
		scroll-padding-block: 1.9em 0.25em;
	}

	.head {
		position: sticky;
		z-index: 1;
		top: 0;
		margin: 0;
		padding: 0.45em 0.5em 0.2em;
		background: var(--surface, #fff);
		color: var(--dim, #75736d);
		font-size: 0.78em;
		font-weight: 500;
	}

	/* Off-screen rows skip layout and paint, which keeps a few hundred of them cheap. */
	.option {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-height: 1.9em;
		padding: 0.2em 0.5em;
		border-radius: var(--radius-sm, 6px);
		color: var(--muted, #64625d);
		cursor: pointer;
		content-visibility: auto;
		contain-intrinsic-size: auto 1.9em;
	}

	.option[aria-selected='true'] {
		background: var(--hover, rgb(0 0 0 / 0.06));
		color: var(--ink, #1c1b19);
	}

	.option[data-current] {
		color: var(--ink, #1c1b19);
	}

	.body {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 0.45em;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
	}

	.check {
		color: var(--accent, #2f7f68);
		font-size: 0.85em;
	}

	mark {
		background: none;
		color: var(--ink, #1c1b19);
		font-weight: 600;
	}

	.empty {
		margin: 0;
		padding: 1.2em 0.75em;
		color: var(--dim, #75736d);
		text-align: center;
	}

	.all {
		margin-inline-start: 0.25em;
		padding: 0;
		border: none;
		background: none;
		color: var(--accent, #2f7f68);
		font: inherit;
		cursor: pointer;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3em 0.9em;
		padding: 0.4em 0.6em 0.2em;
		border-top: 1px solid var(--border, #e6e5e1);
		color: var(--dim, #75736d);
		font-size: 0.8em;
	}
</style>
