<script lang="ts">
	import type { Admin } from '@template/core/admin';
	import { Card, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
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

<Header.Root title="Admin">
	<!-- Its own boundary, so the title paints before the stats land. -->
	<svelte:boundary>
		{#snippet pending()}<Header.Item label="Tables">—</Header.Item>{/snippet}
		{@const stats = await getStats()}
		<!-- "in tables", not "on disk": the Database doorway carries `pg_database_size`, which
		     counts the catalogs no segment below stands for. -->
		<Header.Item label="Tables">
			{stats.tables.tables.length}
			<small>{size(total(stats.tables.tables))}</small>
		</Header.Item>
		<Header.Item label="Queue">
			{stats.queue.pending} pending
			{#if stats.queue.running}<small>{stats.queue.running} running</small>{/if}
			{#if stats.queue.failed > 0}<span class="failed">{stats.queue.failed} failed</span>{/if}
		</Header.Item>
		<Header.Item label="Connections">
			{stats.server.connections}
			<small>of {stats.server.max}</small>
		</Header.Item>
		<Header.Item label="Up">{stats.server.started ? f.ago(stats.server.started) : '—'}</Header.Item>
		<Header.Item label="Postgres">{stats.server.version}</Header.Item>
	</svelte:boundary>
</Header.Root>

<!-- A boundary per query rather than one await for both: the stats read and the log tail are
     independent, so neither waits on the other to paint. `getStats()` is one round trip no
     matter how many boundaries below ask for it. -->
<svelte:boundary>
	{#snippet pending()}<Skeleton h="76px" w="min(100%, 64em)" />{/snippet}
	<Rule parts={parts((await getStats()).tables.tables)} />
</svelte:boundary>

<nav class="places" aria-label="Back office">
	<svelte:boundary>
		{#snippet pending()}<Skeleton h="88px" w="min(100%, 64em)" />{/snippet}
		{@const counts = (await getStats()).counts}
		{@render place(
			'/admin/users',
			'Users',
			counts.users.toLocaleString(),
			`${counts.disabled} disabled`
		)}
	</svelte:boundary>

	<svelte:boundary>
		{#snippet pending()}<Skeleton h="88px" w="min(100%, 64em)" />{/snippet}
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
		{#snippet pending()}<Skeleton h="88px" w="min(100%, 64em)" />{/snippet}
		{@const stats = await getStats()}
		{@render place('/admin/database', 'Database', size(stats.tables.bytes), 'total on disk')}
	</svelte:boundary>
</nav>

<style>
	small {
		font-weight: 400;
		color: var(--dim);
	}

	.failed {
		color: var(--danger);
	}

	/* Same measure as the rule, so the three doorways share its left spine and right edge
	   instead of running out to the shell's full 1440px on their own. */
	.places {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75em;
		max-width: 64em;
		margin: 3em 0 2.5em;
	}

	.place {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	.label {
		font-size: 0.86em;
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

	@media (max-width: 640px) {
		.places {
			grid-template-columns: 1fr;
		}
	}
</style>
