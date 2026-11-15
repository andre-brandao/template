<!-- Every user table by size: a bar against the largest, its rows and its bytes. -->
<script lang="ts">
	import type { Admin } from '@template/core/admin';
	import { Empty, Meter } from '@template/ui';
	import { fmt } from '#lib/utils/fmt.ts';
	import { size } from '#lib/utils/size.ts';

	let { tables }: { tables: Admin.Table[] } = $props();

	const f = fmt();
	const widest = $derived(Math.max(...tables.map((table) => table.bytes), 1));
</script>

{#if tables.length === 0}
	<Empty>No tables yet.</Empty>
{:else}
	<ul>
		{#each tables as table (table.name)}
			<li>
				<span class="name">{table.name}</span>
				<span class="bar"><Meter value={table.bytes} max={widest} /></span>
				<span class="rows">{f.number(table.rows)} rows</span>
				<span class="bytes">{size(table.bytes)}</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: minmax(0, 10em) 1fr auto auto;
		align-items: center;
		gap: 1em;
		padding: 0.5em 0.9em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: 0.9em;
	}

	.name {
		font-family: var(--font-mono);
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.rows,
	.bytes {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.bytes {
		min-width: 5em;
		text-align: right;
	}

	/* On a phone the numbers carry it alone; the name takes the row and wraps the rest under. */
	@media (max-width: 40em) {
		li {
			grid-template-columns: 1fr auto;
			gap: 0.25em 1em;
		}

		.bar {
			display: none;
		}

		.rows {
			grid-column: 1;
			font-size: 0.85em;
		}

		.bytes {
			grid-row: 1;
			grid-column: 2;
		}
	}
</style>
