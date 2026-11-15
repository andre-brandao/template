<script module lang="ts">
	import type { Todo } from '@template/core/todo';
	import type { Picks } from '../filter';

	export type Filters = Picks & { search: string };
</script>

<!-- The todo filters as `Header.Group`s, for a header's `strip`. `children` lands before
     Clear, so a view setting (grouping) can sit on the same row. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/env';
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { hotkeys } from '#lib/hotkeys.ts';
	import { Avatar, Button, Combobox, Input } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import { user } from '#lib/utils/context.ts';
	import { debounce } from '#lib/utils/debounce.ts';
	import { stages, users } from '../api/todos.query';
	import { STATUSES, color, label } from '../status';

	let {
		filters,
		scope = {},
		todos,
		children,
		onchange
	}: {
		filters: Filters;
		scope?: { source?: string; sourceID?: string };
		/** The loaded list, which the chips count; omitted where nothing is loaded (the calendar). */
		todos?: Todo.Info[];
		children?: Snippet;
		onchange: (next: Filters) => void;
	} = $props();

	const me = user();
	// The directory and stages label the chips, so they load up front, in the browser only.
	const people = createQuery(() => ({ ...users(), enabled: browser }));
	const labels = createQuery(() => ({ ...stages(scope), enabled: browser }));

	// Writable derived: typing overrides it, external changes (back/forward, reload) resnap it.
	let input = $derived(filters.search);
	const commit = debounce((search: string) => onchange({ ...filters, search }), 300);
	const pick = (next: Partial<Filters>) => onchange({ ...filters, ...next });

	let field: HTMLInputElement | undefined;
	createHotkey(hotkeys.search, () => field?.focus());

	const filtered = $derived(
		!!(filters.search || filters.assignee.length || filters.stage.length || filters.status.length)
	);

	type Person = { id: string; name: string; email: string; image: string | null };
	const nobody: Person = { id: 'none', name: 'Unassigned', email: '', image: null };
	const assignees = $derived.by(() => {
		const self = me.current;
		const rest = (people.data ?? []).filter((one) => one.id !== self?.id);
		return [...(self ? [self] : []), nobody, ...rest];
	});
	const steps = $derived(['none', ...(labels.data ?? []).map((one) => one.name)]);

	const tally = (by: (todo: Todo.Info) => string) =>
		todos?.reduce(
			(map, one) => map.set(by(one), (map.get(by(one)) ?? 0) + 1),
			new Map<string, number>()
		);
	const counts = $derived({
		status: tally((one) => one.status),
		assignee: tally((one) => one.assignee?.id ?? 'none'),
		stage: tally((one) => one.stage || 'none')
	});
</script>

{#snippet count(map: Map<string, number> | undefined, key: string)}
	{#if map}<span class="count">{map.get(key) ?? 0}</span>{/if}
{/snippet}

{#snippet any()}<span class="any">Any</span>{/snippet}

<Header.Group>
	<Input
		type="search"
		name="search"
		autocomplete="off"
		aria-label="Search todos"
		aria-keyshortcuts="/"
		placeholder="Search todos…"
		value={input}
		{@attach (el: HTMLInputElement) => {
			field = el;
		}}
		oninput={(e) => {
			input = e.currentTarget.value;
			commit(input);
		}}
	/>
</Header.Group>

<Header.Group label="Status">
	<Combobox
		items={[...STATUSES]}
		key={(one) => one}
		text={label}
		multiple
		bind:values={
			() => filters.status, (next) => pick({ status: STATUSES.filter((one) => next.includes(one)) })
		}
		label="Status"
		placeholder="Filter status"
	>
		{#snippet trigger()}{@render any()}{/snippet}
		{#snippet chip(one)}
			<span class="dot" style:--c={color(one)}></span>{label(one)}{@render count(
				counts.status,
				one
			)}
		{/snippet}
		{#snippet item(one, row)}
			<span class="dot" style:--c={color(one)}></span>{@render row.marked(label(one))}
		{/snippet}
	</Combobox>
</Header.Group>

<Header.Group label="Assignee">
	<Combobox
		items={assignees}
		key={(one) => one.id}
		text={(one) => `${one.name} ${one.email}`}
		multiple
		bind:values={() => filters.assignee, (next) => pick({ assignee: next })}
		label="Assignee"
		placeholder="Search people"
	>
		{#snippet trigger()}{@render any()}{/snippet}
		{#snippet chip(one)}
			{one.id === me.current?.id ? 'Me' : one.name}{@render count(counts.assignee, one.id)}
		{/snippet}
		{#snippet item(one, row)}
			{#if one.id !== 'none'}<Avatar name={one.name} image={one.image} size={18} />{/if}
			<span class="name">{@render row.marked(one.name)}</span>
			{#if one.id === me.current?.id}<span class="hint">Me</span>{/if}
		{/snippet}
	</Combobox>
</Header.Group>

<Header.Group label="Stage">
	<Combobox
		items={steps}
		key={(one) => one}
		text={(one) => (one === 'none' ? 'No stage' : one)}
		multiple
		bind:values={() => filters.stage, (next) => pick({ stage: next })}
		label="Stage"
		placeholder="Search stages"
	>
		{#snippet trigger()}{@render any()}{/snippet}
		{#snippet chip(one)}
			{one === 'none' ? 'No stage' : one}{@render count(counts.stage, one)}
		{/snippet}
	</Combobox>
</Header.Group>

{@render children?.()}

{#if filtered}
	<Header.Group end>
		<Button
			variant="ghost"
			onclick={() => {
				input = '';
				onchange({ status: [], assignee: [], stage: [], search: '' });
			}}
		>
			Clear filters
		</Button>
	</Header.Group>
{/if}

<style>
	.any {
		color: var(--muted);
	}

	.dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--c);
	}

	.count {
		color: var(--dim);
		font-variant-numeric: tabular-nums;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hint {
		margin-inline-start: auto;
		color: var(--dim);
		font-size: 0.85em;
	}
</style>
