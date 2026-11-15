<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty, Issue, Meter, Skeleton, Stat } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { stats } from '../api/admin.query';
	import Queue from '../components/Queue.svelte';

	const all = createQuery(() => stats());
	const f = fmt();
</script>

{#if all.isSuccess}
	{@const s = all.data}
	{@const load = s.server.connections / Math.max(1, s.server.max)}
	<!-- Bars are bytes relative to the largest table. -->
	{@const widest = Math.max(...s.tables.tables.map((t) => t.bytes), 1)}
	<Header.Root title="Database">
		<Header.Item label="On disk">{size(s.tables.bytes)}</Header.Item>
		<Header.Item label="Queue"><Queue queue={s.queue} /></Header.Item>
		<Header.Item label="Connections">
			<span class="meter"><Meter value={load} tone={load > 0.8 ? 'danger' : 'accent'} /></span>
			{s.server.connections}
			<small>of {s.server.max}</small>
		</Header.Item>
		<Header.Item label="Postgres">{s.server.version}</Header.Item>
		<Header.Item label="Up">
			<span title={s.server.started ? f.stamp(s.server.started) : undefined}>
				{s.server.started ? f.ago(s.server.started) : '—'}
			</span>
		</Header.Item>
	</Header.Root>

	<section>
		<h2>Instance</h2>
		<div class="stats">
			<Stat label="Users" value={f.number(s.counts.users)} note="{s.counts.disabled} disabled" />
			<Stat label="Projects" value={f.number(s.counts.projects)} />
			<Stat label="Todos" value={f.number(s.counts.todos)} note="{s.counts.done} done" />
		</div>
	</section>

	<section>
		<h2>Tables</h2>
		{#if s.tables.tables.length === 0}
			<Empty>No tables yet.</Empty>
		{:else}
			<ul>
				{#each s.tables.tables as table (table.name)}
					<li>
						<span class="name">{table.name}</span>
						<span class="bar"><Meter value={table.bytes} max={widest} /></span>
						<span class="rows">{f.number(table.rows)} rows</span>
						<span class="bytes">{size(table.bytes)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{:else}
	<Header.Root title="Database" />
	{#if all.isError}
		<Issue>{all.error.message}</Issue>
	{:else}
		<Skeleton h="16em" />
	{/if}
{/if}

<style>
	small {
		font-weight: 400;
		color: var(--dim);
	}

	.meter {
		flex: none;
		width: 4em;
	}

	section {
		margin-bottom: 2em;
	}

	h2 {
		margin: 0 0 0.75em;
		font-size: 0.95em;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11em, 1fr));
		gap: 0.6em;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35em;
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
