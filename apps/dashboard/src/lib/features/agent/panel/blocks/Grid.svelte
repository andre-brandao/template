<!-- Every column of a result, scrolling sideways when wide. -->
<script lang="ts">
	import type { Result } from '../rows';

	let { data }: { data: Result } = $props();

	const cell = (value: unknown) =>
		value === null || value === undefined
			? '—'
			: typeof value === 'object'
				? JSON.stringify(value)
				: String(value);
</script>

<div class="wrap">
	<table>
		<thead>
			<tr>
				{#each data.columns as col (col.name)}<th>{col.name}</th>{/each}
			</tr>
		</thead>
		<tbody>
			{#each data.rows.slice(0, 200) as row, i (i)}
				<tr>
					{#each data.columns as col (col.name)}<td>{cell(row[col.name])}</td>{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.wrap {
		max-height: 20rem;
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.78em;
	}

	th,
	td {
		padding: 0.35em 0.6em;
		border-bottom: 1px solid var(--border);
		text-align: left;
		white-space: nowrap;
	}

	th {
		position: sticky;
		top: 0;
		background: var(--surface-2);
		color: var(--muted);
		font-weight: 500;
	}
</style>
