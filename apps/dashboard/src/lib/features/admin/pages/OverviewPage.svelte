<script lang="ts">
	import type { Admin } from '@template/core/admin';
	import { createQuery } from '@tanstack/svelte-query';
	import { Issue, Skeleton, Stat } from '@template/ui';
	import * as Header from '$lib/components/header';
	import Rule from '$lib/components/Rule.svelte';
	import { fmt } from '$lib/utils/fmt';
	import { size } from '$lib/utils/size';
	import { events, stats } from '../api/admin.query';
	import Queue from '../components/Queue.svelte';

	const f = fmt();
	const all = createQuery(() => stats());
	// One entry carries both figures the Logs tile needs: the count and the newest stamp.
	const log = createQuery(() => events({ page: 1, pageSize: 1 }));

	// The calendar's teal ramp, biggest table darkest; past four, the rest is one segment.
	const ramp = ['var(--cal-4)', 'var(--cal-3)', 'var(--cal-2)', 'var(--cal-1)'];

	// Against the user tables' sum, not `pg_database_size`, so the segments reach the end.
	const total = (tables: Admin.Table[]) => tables.reduce((sum, table) => sum + table.bytes, 0);

	function parts(tables: Admin.Table[]) {
		const whole = Math.max(1, total(tables));
		const head = tables.slice(0, ramp.length).map((table, i) => ({
			label: table.name,
			value: size(table.bytes),
			note: `${f.number(table.rows)} rows`,
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
				color: 'var(--dim)',
				pct: (spare / whole) * 100
			}
		];
	}
</script>

<Header.Root title="Admin">
	{#if all.isSuccess}
		{@const s = all.data}
		<Header.Item label="Tables">
			{s.tables.tables.length}
			<small>{size(total(s.tables.tables))}</small>
		</Header.Item>
		<Header.Item label="Queue"><Queue queue={s.queue} /></Header.Item>
		<Header.Item label="Connections">
			{s.server.connections}
			<small>of {s.server.max}</small>
		</Header.Item>
		<Header.Item label="Up">{s.server.started ? f.ago(s.server.started) : '—'}</Header.Item>
		<Header.Item label="Postgres">{s.server.version}</Header.Item>
	{:else}
		<Header.Item label="Tables">—</Header.Item>
	{/if}
</Header.Root>

{#if all.isError}
	<Issue>{all.error.message}</Issue>
{:else if all.isSuccess}
	<Rule parts={parts(all.data.tables.tables)} />
{:else}
	<Skeleton h="76px" w="min(100%, 64em)" />
{/if}

<nav class="places" aria-label="Back office">
	{#if all.isSuccess}
		<Stat
			href="/admin/users"
			label="Users"
			value={f.number(all.data.counts.users)}
			note="{all.data.counts.disabled} disabled"
		/>
	{:else}
		<Skeleton h="88px" />
	{/if}
	{#if log.isSuccess}
		<Stat
			href="/admin/logs"
			label="Logs"
			value={f.number(log.data.total)}
			note={log.data.data[0] ? `last ${f.ago(log.data.data[0].timeCreated)}` : 'nothing recorded'}
		/>
	{:else}
		<Skeleton h="88px" />
	{/if}
	{#if all.isSuccess}
		<Stat
			href="/admin/database"
			label="Database"
			value={size(all.data.tables.bytes)}
			note="total on disk"
		/>
	{:else}
		<Skeleton h="88px" />
	{/if}
</nav>

<style>
	small {
		font-weight: 400;
		color: var(--dim);
	}

	/* The rule's measure, so the tiles share its edges. */
	.places {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75em;
		max-width: 64em;
		margin: 3em 0 2.5em;
	}

	@media (max-width: 640px) {
		.places {
			grid-template-columns: 1fr;
		}
	}
</style>
