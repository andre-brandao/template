<script lang="ts">
	import { Empty } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { getStats } from '../api/admin.remote';
	import Stat from '../components/Stat.svelte';

	const stats = $derived(await getStats());
	const f = fmt();
	const load = $derived(stats.server.connections / Math.max(1, stats.server.max));

	// Row counts come from the planner's live-tuple estimate, so the widest bar is a
	// proportion of the largest table rather than an exact share of anything.
	const widest = $derived(Math.max(...stats.tables.tables.map((t) => t.bytes), 1));
</script>

<!-- Queue and server are single figures, so they ride the facts band; the sections below
     keep what needs room: row counts and the per-table breakdown. -->
<Header.Root title="Database">
	<Header.Item label="On disk">{size(stats.tables.bytes)}</Header.Item>
	<Header.Item label="Queue">
		{stats.queue.pending} pending
		{#if stats.queue.running}<small>{stats.queue.running} running</small>{/if}
		{#if stats.queue.failed > 0}<span class="failed">{stats.queue.failed} failed</span>{/if}
		{#if stats.queue.oldest}<small>oldest {f.ago(stats.queue.oldest)}</small>{/if}
	</Header.Item>
	<Header.Item label="Connections">
		<span class={['meter', { high: load > 0.8 }]} aria-hidden="true">
			<i style:width="{Math.min(1, load) * 100}%"></i>
		</span>
		{stats.server.connections}
		<small>of {stats.server.max}</small>
	</Header.Item>
	<Header.Item label="Postgres">{stats.server.version}</Header.Item>
	<Header.Item label="Up">
		<span title={stats.server.started ? f.stamp(stats.server.started) : undefined}>
			{stats.server.started ? f.ago(stats.server.started) : '—'}
		</span>
	</Header.Item>
</Header.Root>

<section>
	<h2>Instance</h2>
	<div class="stats">
		<Stat label="Users" value={stats.counts.users} note={`${stats.counts.disabled} disabled`} />
		<Stat label="Projects" value={stats.counts.projects} />
		<Stat label="Todos" value={stats.counts.todos} note={`${stats.counts.done} done`} />
	</div>
</section>

<section>
	<h2>Tables</h2>
	{#if stats.tables.tables.length === 0}
		<Empty>No tables yet.</Empty>
	{:else}
		<ul>
			{#each stats.tables.tables as table (table.name)}
				<li>
					<span class="name">{table.name}</span>
					<span class="bar" aria-hidden="true">
						<span class="fill" style="width: {(table.bytes / widest) * 100}%"></span>
					</span>
					<span class="rows">{table.rows.toLocaleString()} rows</span>
					<span class="bytes">{size(table.bytes)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	small {
		font-weight: 400;
		color: var(--dim);
	}

	.failed {
		color: var(--danger);
	}

	.meter {
		flex: none;
		display: block;
		width: 4em;
		height: 0.4em;
		border-radius: 2px;
		background: var(--border);
		overflow: hidden;
	}

	.meter i {
		display: block;
		height: 100%;
		background: var(--done);
	}

	.meter.high i {
		background: var(--danger);
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
		grid-template-columns: 10em 1fr auto auto;
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

	.bar {
		height: 0.4em;
		border-radius: 999px;
		background: var(--raised, var(--border));
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--accent);
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

	/* The bar is decoration; below the fold of a phone the numbers carry it alone. */
	@media (max-width: 40em) {
		li {
			grid-template-columns: 1fr auto;
		}

		.bar {
			display: none;
		}
	}
</style>
