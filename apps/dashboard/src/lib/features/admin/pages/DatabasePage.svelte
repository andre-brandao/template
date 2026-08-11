<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { getStats } from '../api/admin.remote';
	import Stat from '../components/Stat.svelte';

	const stats = $derived(await getStats());
	const f = fmt();

	// Row counts come from the planner's live-tuple estimate, so the widest bar is a
	// proportion of the largest table rather than an exact share of anything.
	const widest = $derived(Math.max(...stats.tables.tables.map((t) => t.bytes), 1));
</script>

<Header title="Database">
	Live figures, read straight from Postgres each time this page loads. Nothing here is stored
	or cached.
</Header>

<section>
	<h2>Instance</h2>
	<div class="stats">
		<Stat label="Users" value={stats.counts.users} note={`${stats.counts.disabled} disabled`} />
		<Stat label="Projects" value={stats.counts.projects} />
		<Stat label="Todos" value={stats.counts.todos} note={`${stats.counts.done} done`} />
		<Stat label="Database" value={size(stats.tables.bytes)} note="total on disk" />
	</div>
</section>

<section>
	<h2>Queue</h2>
	<div class="stats">
		<Stat
			label="Pending"
			value={stats.queue.pending}
			note={stats.queue.oldest ? `oldest ${f.ago(stats.queue.oldest)}` : 'nothing waiting'}
		/>
		<Stat label="Running" value={stats.queue.running} />
		<Stat label="Failed" value={stats.queue.failed} note="buried, kept for inspection" />
	</div>
</section>

<section>
	<h2>Server</h2>
	<div class="stats">
		<Stat label="Postgres" value={stats.server.version} />
		<Stat
			label="Connections"
			value={`${stats.server.connections} / ${stats.server.max}`}
			note="in use vs max_connections"
		/>
		<Stat
			label="Up since"
			value={stats.server.started ? f.ago(stats.server.started) : '—'}
			note={stats.server.started ? f.stamp(stats.server.started) : undefined}
		/>
	</div>
</section>

<section>
	<h2>Tables</h2>
	{#if stats.tables.tables.length === 0}
		<p class="empty">No tables yet.</p>
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

	.empty {
		color: var(--dim);
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
