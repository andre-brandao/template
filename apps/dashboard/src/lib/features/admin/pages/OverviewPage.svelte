<script lang="ts">
	import type { Admin } from '@template/core/admin';
	import { Card } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import Rule from '$lib/components/Rule.svelte';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { getEvents, getStats } from '../api/admin.remote';

	const f = fmt();

	// The teal ramp the contribution calendar already uses, biggest table darkest. Four
	// steps, then everything left over as one segment — past that the labels stop fitting
	// and the per-table breakdown is what /admin/database is for.
	const ramp = ['var(--cal-4)', 'var(--cal-3)', 'var(--cal-2)', 'var(--cal-1)'];

	// Measured against what the user tables add up to, not `pg_database_size` — that total
	// counts catalogs nothing here lists, so the segments would never reach the end.
	const total = (tables: Admin.Table[]) => tables.reduce((sum, table) => sum + table.bytes, 0);

	function parts(tables: Admin.Table[]) {
		const whole = Math.max(1, total(tables));
		const head = tables.slice(0, ramp.length).map((table, i) => ({
			label: table.name,
			value: size(table.bytes),
			note: `${table.rows.toLocaleString()} rows`,
			color: ramp[i],
			pct: (table.bytes / whole) * 100
		}));
		const rest = tables.slice(ramp.length);
		if (rest.length === 0) return head;
		const spare = total(rest);
		return [
			...head,
			{
				label: `${rest.length} more`,
				value: size(spare),
				// Off the ramp on purpose: this segment is a leftover, not another table.
				color: 'var(--dim)',
				pct: (spare / whole) * 100
			}
		];
	}
</script>

{#snippet place(href: string, label: string, value: string, note: string)}
	<Card {href} interactive>
		<div class="place">
			<span class="label">{label}</span>
			<span class="value">{value}</span>
			<span class="note">{note}</span>
		</div>
	</Card>
{/snippet}

<Header title="Admin">
	Live figures, read straight from Postgres each time this page loads. Nothing here is stored or
	cached.
</Header>

<!-- A boundary per query rather than one await for both: the stats read and the log tail are
     independent, so neither waits on the other to paint. `getStats()` is one round trip no
     matter how many boundaries below ask for it. -->
<svelte:boundary>
	{#snippet pending()}<div class="skel" style:height="76px"></div>{/snippet}
	{@const tables = (await getStats()).tables.tables}
	<!-- "in tables", not "on disk": the card below carries `pg_database_size`, which counts the
	     catalogs no segment here stands for. The two figures differ, so they are named apart. -->
	<Rule parts={parts(tables)} tail={`${tables.length} tables · ${size(total(tables))}`} />
</svelte:boundary>

<nav class="places" aria-label="Back office">
	<svelte:boundary>
		{#snippet pending()}<div class="skel" style:height="88px"></div>{/snippet}
		{@const counts = (await getStats()).counts}
		{@render place(
			'/admin/users',
			'Users',
			counts.users.toLocaleString(),
			`${counts.disabled} disabled`
		)}
	</svelte:boundary>

	<svelte:boundary>
		{#snippet pending()}<div class="skel" style:height="88px"></div>{/snippet}
		<!-- One event row is enough for both figures the doorway needs: the count and the
		     newest stamp. -->
		{@const events = await getEvents({ page: 1, pageSize: 1 })}
		{@render place(
			'/admin/logs',
			'Logs',
			events.total.toLocaleString(),
			events.data[0] ? `last ${f.ago(events.data[0].timeCreated)}` : 'nothing recorded'
		)}
	</svelte:boundary>

	<svelte:boundary>
		{#snippet pending()}<div class="skel" style:height="88px"></div>{/snippet}
		{@const stats = await getStats()}
		{@render place('/admin/database', 'Database', size(stats.tables.bytes), 'total on disk')}
	</svelte:boundary>
</nav>

<!-- Runs of text rather than three more tiles, so the row above reads as "the three
     places to go" instead of one stat block among several. -->
<svelte:boundary>
	{#snippet pending()}<div class="skel" style:height="56px"></div>{/snippet}
	{@const stats = await getStats()}
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
</svelte:boundary>

<style>
	/* Same measure as the rule, so the three doorways share its left spine and right edge
	   instead of running out to the shell's full 1440px on their own. */
	.places,
	.vitals,
	.skel {
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

	.skel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		animation: pulse 1.2s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.45;
		}
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
