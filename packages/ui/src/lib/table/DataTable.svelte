<!-- fallow-ignore-file complexity -- header sort controls and the expand drawer are each one guard over a table primitive; branches are table features, not logic. -->
<script lang="ts" generics="TData extends RowData">
	import { FlexRender } from '@tanstack/svelte-table';
	import type { Row, RowData, Table } from '@tanstack/svelte-table';
	import type { Features } from './table';
	import type { Snippet } from 'svelte';

	let {
		table,
		detail,
		empty = 'Nothing here'
	}: {
		table: Table<Features, TData>;
		/** Full-width row under an expanded row — sub-components, raw JSON. */
		detail?: Snippet<[Row<Features, TData>]>;
		empty?: string;
	} = $props();

	const rows = $derived(table.getRowModel().rows);
	const span = $derived(table.getAllLeafColumns().length);

	type Dir = false | 'asc' | 'desc';

	const aria = (dir: Dir) =>
		dir === 'asc' ? ('ascending' as const) : dir === 'desc' ? ('descending' as const) : undefined;

	const arrow = (dir: Dir) => (dir === 'asc' ? '↑' : dir === 'desc' ? '↓' : '');

	// Priority numbers only mean something once a second key is in play.
	const multi = $derived((table.atoms.sorting?.get()?.length ?? 0) > 1);

</script>

<div class="wrap">
	<table>
		<thead>
			{#each table.getHeaderGroups() as group (group.id)}
				<tr>
					{#each group.headers as header (header.id)}
						<th data-col={header.column.id} aria-sort={aria(header.column.getIsSorted())}>
							{#if header.column.getCanSort()}
								<button type="button" onclick={header.column.getToggleSortingHandler()}>
									<FlexRender {header} />
									<span class="arrow">{arrow(header.column.getIsSorted())}</span>
									{#if multi && header.column.getSortIndex() >= 0}
										<sub>{header.column.getSortIndex() + 1}</sub>
									{/if}
								</button>
							{:else}
								<FlexRender {header} />
							{/if}
						</th>
					{/each}
				</tr>
			{/each}
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr>
					{#each row.getAllCells() as cell (cell.id)}
						<td data-col={cell.column.id}><FlexRender {cell} /></td>
					{/each}
				</tr>
				{#if detail && row.getIsExpanded()}
					<tr class="drawer">
						<td colspan={span}>{@render detail(row)}</td>
					</tr>
				{/if}
			{/each}
			{#if rows.length === 0}
				<tr><td colspan={span} class="empty">{empty}</td></tr>
			{/if}
		</tbody>
	</table>
</div>

<style>
	.wrap {
		overflow: auto;
		scrollbar-width: thin;
		max-height: 65vh;
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92em;
	}

	thead th {
		position: sticky;
		top: 0;
		z-index: 1;
		text-align: left;
		font-family: var(--font-mono);
		font-size: 0.72em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		background: var(--surface-2);
		padding: 0.6em 0.9em;
		border-bottom: 1px solid var(--border);
	}

	thead button {
		all: unset;
		cursor: pointer;
	}

	thead button:hover {
		color: var(--ink);
	}

	.arrow {
		display: inline-block;
		width: 1em;
		text-align: center;
	}

	sub {
		font-size: 0.75em;
		color: var(--accent);
		vertical-align: super;
	}

	th[aria-sort] button {
		color: var(--ink);
	}

	.empty {
		text-align: center;
		color: var(--dim);
		padding: 1.5em;
	}

	tbody td {
		padding: 0.6em 0.9em;
		border-bottom: 1px solid var(--border);
		vertical-align: middle;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	tbody tr:hover {
		background: color-mix(in srgb, var(--ink) 4%, transparent);
	}

	/* The drawer belongs to the row above it, so it neither hovers nor pads on its own. */
	.drawer:hover {
		background: none;
	}

	.drawer td {
		padding: 0;
	}
</style>
