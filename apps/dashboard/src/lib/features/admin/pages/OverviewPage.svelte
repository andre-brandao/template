<script lang="ts">
	import { Card } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import Rule from '$lib/components/Rule.svelte';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { getEvents, getStats } from '../api/admin.remote';

	// One await, not two: a second `$derived(await …)` is not created until the first has
	// resolved, so the round trips would queue up instead of running together.
	// One event row is enough for both figures the doorway needs: the count and the newest stamp.
	const [stats, events] = $derived(
		await Promise.all([getStats(), getEvents({ page: 1, pageSize: 1 })])
	);
	const f = fmt();

	// The teal ramp the contribution calendar already uses, biggest table darkest. Four
	// steps, then everything left over as one segment — past that the labels stop fitting
	// and the per-table breakdown is what /admin/database is for.
	const ramp = ['var(--cal-4)', 'var(--cal-3)', 'var(--cal-2)', 'var(--cal-1)'];

	// Measured against what the user tables add up to, not `pg_database_size` — that total
	// counts catalogs nothing here lists, so the segments would never reach the end.
	const bytes = $derived(stats.tables.tables.reduce((sum, table) => sum + table.bytes, 0));

	const parts = $derived.by(() => {
		const total = Math.max(1, bytes);
		const head = stats.tables.tables.slice(0, ramp.length).map((table, i) => ({
			label: table.name,
			value: size(table.bytes),
			note: `${table.rows.toLocaleString()} rows`,
			color: ramp[i],
			pct: (table.bytes / total) * 100
		}));
		const rest = stats.tables.tables.slice(ramp.length);
		if (rest.length === 0) return head;
		const spare = rest.reduce((sum, table) => sum + table.bytes, 0);
		return [
			...head,
			{
				label: `${rest.length} more`,
				value: size(spare),
				// Off the ramp on purpose: this segment is a leftover, not another table.
				color: 'var(--dim)',
				pct: (spare / total) * 100
			}
		];
	});

	const places = $derived([
		{
			href: '/admin/users',
			label: 'Users',
			value: stats.counts.users.toLocaleString(),
			note: `${stats.counts.disabled} disabled`
		},
		{
			href: '/admin/logs',
			label: 'Logs',
			value: events.total.toLocaleString(),
			note: events.data[0] ? `last ${f.ago(events.data[0].timeCreated)}` : 'nothing recorded'
		},
		{
			href: '/admin/database',
			label: 'Database',
			value: size(stats.tables.bytes),
			note: 'total on disk'
		}
	]);
</script>

<Header title="Admin">
	Live figures, read straight from Postgres each time this page loads. Nothing here is stored or
	cached.
</Header>

<!-- "in tables", not "on disk": the card below carries `pg_database_size`, which counts the
     catalogs no segment here stands for. The two figures differ, so they are named apart. -->
<Rule {parts} tail={`${stats.tables.tables.length} tables · ${size(bytes)}`} />

<nav class="places" aria-label="Back office">
	{#each places as place (place.href)}
		<Card href={place.href} interactive>
			<div class="place">
				<span class="label">{place.label}</span>
				<span class="value">{place.value}</span>
				<span class="note">{place.note}</span>
			</div>
		</Card>
	{/each}
</nav>

<!-- Runs of text rather than three more tiles, so the row above reads as "the three
     places to go" instead of one stat block among several. -->
<dl class="vitals">
	<dt>Queue</dt>
	<dd>
		{stats.queue.pending} pending · {stats.queue.running} running · {stats.queue.failed} failed ·
		oldest {stats.queue.oldest ? f.ago(stats.queue.oldest) : '—'}
	</dd>
	<dt>Server</dt>
	<dd>
		PostgreSQL {stats.server.version} · {stats.server.connections}/{stats.server.max} connections ·
		up since {stats.server.started ? f.ago(stats.server.started) : '—'}
	</dd>
</dl>

<style>
	/* Same measure as the rule, so the three doorways share its left spine and right edge
	   instead of running out to the shell's full 1440px on their own. */
	.places,
	.vitals {
		max-width: 64em;
	}

	.places {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75em;
		margin: 3em 0 2.5em;
	}

	.place {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	.label {
		font-family: var(--font-mono);
		font-size: 0.68em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.value {
		font-size: 1.3em;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}

	.note {
		font-size: 0.78em;
		color: var(--muted);
	}

	.vitals {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5em 1.5em;
		margin: 0;
		font-size: 0.85em;
	}

	.vitals dt {
		font-family: var(--font-mono);
		font-size: 0.8em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--dim);
		padding-top: 0.15em;
	}

	.vitals dd {
		margin: 0;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 640px) {
		.places {
			grid-template-columns: 1fr;
		}

		.vitals {
			grid-template-columns: 1fr;
			gap: 0.15em;
		}

		.vitals dt:not(:first-child) {
			margin-top: 1em;
		}
	}
</style>
