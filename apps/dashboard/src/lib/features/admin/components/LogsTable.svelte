<script lang="ts">
	import { untrack } from 'svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { createTable, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, ExpandedState, Row } from '@tanstack/svelte-table';
	import { Avatar, DataTable, features } from '@template/ui';
	import type { Event } from '@template/core/event';
	import { fmt } from '$lib/utils/fmt';
	import { events } from '../sort';

	let {
		rows,
		sorting,
		onsort,
		onuser
	}: {
		rows: Event.Info[];
		sorting: ReturnType<typeof events.decode>;
		onsort: (next: ReturnType<typeof events.encode>) => void;
		onuser: (id: string) => void;
	} = $props();

	const f = fmt();

	// Which drawers are open is view state, not a filter — it stays out of the URL.
	let expanded = $state<ExpandedState>({});

	// The prop is derived from the URL, which only lands once the navigation — and the
	// `getEvents` it re-runs — has resolved. Handing that back to TanStack on the next click
	// would give it a pre-click value, which it treats as a replace rather than an append.
	// Local state leads; the prop follows.
	let live = $state(untrack(() => sorting));

	$effect(() => {
		live = sorting;
	});

	type Cell = Row<typeof features, Event.Info>;

	const cols: ColumnDef<typeof features, Event.Info>[] = [
		{ id: 'type', header: 'Type', accessorFn: (one) => one.type, cell: ({ row }) => renderSnippet(type, row) },
		{ id: 'user', header: 'Who', accessorFn: (one) => one.user?.name, cell: ({ row }) => renderSnippet(who, row) },
		{ id: 'tags', header: 'Tags', enableSorting: false, cell: ({ row }) => renderSnippet(tags, row) },
		{ id: 'source', header: 'Ref', accessorFn: (one) => one.source, cell: ({ row }) => renderSnippet(ref, row) },
		{
			id: 'timeCreated',
			header: 'When',
			accessorFn: (one) => one.timeCreated,
			cell: ({ row }) => renderSnippet(when, row)
		}
	];

	const table = createTable({
		features,
		columns: cols,
		get data() {
			return rows;
		},
		getRowId: (one) => one.id,
		state: {
			get sorting() {
				return live;
			},
			get expanded() {
				return expanded;
			}
		},
		onSortingChange: (next) => {
			live = typeof next === 'function' ? next(live) : next;
			onsort(events.encode(live));
		},
		onExpandedChange: (next) => (expanded = typeof next === 'function' ? next(expanded) : next),
		// Nothing here has sub-rows; every row can open to show its payload.
		getRowCanExpand: () => true,
		// Without this the feature wipes `expanded` on every core row-model recompute — which
		// the adapter triggers on the very options sync that opening a row causes.
		autoResetExpanded: false,
		manualSorting: true,
		maxMultiSortColCount: 3
	});
</script>

{#snippet type(row: Cell)}
	<button
		type="button"
		class="toggle"
		class:open={row.getIsExpanded()}
		aria-expanded={row.getIsExpanded()}
		onclick={row.getToggleExpandedHandler()}
	>
		<ChevronRight class="mark" size={14} strokeWidth={2} />
		<span class="type">{row.original.type}</span>
	</button>
{/snippet}

{#snippet who(row: Cell)}
	{#if row.original.user}
		{@const one = row.original.user}
		<button class="who" type="button" onclick={() => onuser(one.id)} title="Filter to this user">
			<Avatar name={one.name} image={one.image} size={20} />
			{one.name}
		</button>
	{:else}
		<!-- No user means a system or public actor; the tag on the row says which. -->
		<span class="none">
			{row.original.tags.find((tag) => tag.startsWith('actor:')) ?? 'system'}
		</span>
	{/if}
{/snippet}

{#snippet tags(row: Cell)}
	<!-- `actor:*` is what the who column already renders, so showing it again is noise. -->
	<span class="tags">
		{#each row.original.tags.filter((tag) => !tag.startsWith('actor:')) as tag (tag)}
			<span class="tag">{tag}</span>
		{/each}
	</span>
{/snippet}

{#snippet ref(row: Cell)}
	<span class="none">
		{#if row.original.sourceID}{row.original.source} · {row.original.sourceID}{/if}
	</span>
{/snippet}

{#snippet when(row: Cell)}
	<time datetime={row.original.timeCreated} title={f.stamp(row.original.timeCreated)}>
		{f.ago(row.original.timeCreated)}
	</time>
{/snippet}

<!-- Narrow viewports drop the least load-bearing columns. Header and cells share a
     `data-col`, so each hides as a pair and the grid stays aligned. -->
<div class="log">
	<DataTable {table} empty="Nothing recorded.">
		{#snippet detail(row)}
			<!-- `data` is free-form jsonb and every type carries a different shape, so it is
			     shown verbatim rather than guessed at. -->
			{#if Object.keys(row.original.data).length === 0}
				<p class="none data">This entry carries no data.</p>
			{:else}
				<pre>{JSON.stringify(row.original.data, null, 2)}</pre>
			{/if}
		{/snippet}
	</DataTable>
</div>

<style>
	.toggle {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
		text-align: left;
	}

	:global(.mark) {
		flex: none;
		color: var(--dim);
		transition: transform 120ms ease;
	}

	.toggle.open :global(.mark) {
		transform: rotate(90deg);
	}

	.type {
		font-family: var(--font-mono);
		font-size: 0.9em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.who {
		display: flex;
		align-items: center;
		gap: 0.45em;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.who:hover {
		text-decoration: underline;
	}

	.none {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--dim);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Clipped rather than wrapped — a row with a dozen tags must not be taller than its
	   neighbours; the expanded JSON carries the full list. */
	.tags {
		display: flex;
		gap: 0.3em;
		min-width: 0;
		overflow: hidden;
	}

	.tag {
		padding: 0.1em 0.5em;
		border-radius: 999px;
		background: var(--surface-2);
		font-size: 0.8em;
		color: var(--muted);
		white-space: nowrap;
	}

	time {
		color: var(--dim);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.data {
		margin: 0;
		padding: 0.9em;
	}

	pre {
		margin: 0;
		padding: 0.9em;
		max-height: 22em;
		overflow: auto;
		font-family: var(--font-mono);
		font-size: 0.8em;
		line-height: 1.5;
		color: var(--muted);
		tab-size: 2;
	}

	@media (max-width: 70em) {
		.log :global(th[data-col='source']),
		.log :global(td[data-col='source']) {
			display: none;
		}
	}

	@media (max-width: 55em) {
		.log :global(th[data-col='tags']),
		.log :global(td[data-col='tags']) {
			display: none;
		}
	}
</style>
