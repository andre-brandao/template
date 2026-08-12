<script lang="ts">
	import { z } from 'zod';
	import { Button, Input, Pager, Select } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import { debounce } from '$lib/utils/debounce';
	import { query } from '$lib/utils/params';
	import { getEvents, getFacets } from '../api/admin.remote';
	import EventRow from '../components/EventRow.svelte';

	// Filters live in the URL so a narrowed log can be linked, reloaded and stepped back
	// through — the same treatment insights gives its date range.
	const params = query(
		z.object({
			q: z.string().default(''),
			type: z.string().default(''),
			source: z.string().default(''),
			user: z.string().default(''),
			page: z.coerce.number().int().min(1).default(1)
		})
	);

	const facets = $derived(await getFacets());
	const args = $derived({
		search: params.q || undefined,
		type: params.type || undefined,
		source: params.source || undefined,
		userID: params.user || undefined,
		page: params.page,
		pageSize: 50
	});
	const events = $derived(await getEvents(args));
	const filtered = $derived(!!(params.q || params.type || params.source || params.user));

	const any = (label: string, values: string[]) => [
		{ value: '', label },
		...values.map((value) => ({ value, label: value }))
	];

	// `undefined` drops the key entirely, so narrowing always lands back on page one and the
	// URL stays as short as the filters actually in use.
	const pick = (next: Partial<typeof params>) => params.update({ ...next, page: undefined });
	const commit = debounce((q: string) => pick({ q }), 300);
</script>

<!-- Header, filters and pager hold still; only the list scrolls. A log is read by
     narrowing it, so the controls that narrow it have to stay in reach. -->
<div class="fill">
	<Header title="Logs">
		Every audit entry this instance has recorded, newest first. Entries are written by core as
		side effects of the actions themselves, so they cannot be edited or deleted from here.
	</Header>

	<div class="bar">
	<Input
		type="search"
		placeholder="Search type or source id"
			value={params.q}
			oninput={(e) => commit(e.currentTarget.value)}
		/>
		<Select
			options={any('All types', facets.types)}
			value={params.type}
			onchange={(e) => pick({ type: e.currentTarget.value })}
		/>
		<Select
			options={any('All sources', facets.sources)}
			value={params.source}
			onchange={(e) => pick({ source: e.currentTarget.value })}
		/>
		{#if filtered}
			<Button variant="ghost" onclick={() => pick({ q: '', type: '', source: '', user: '' })}>
				Clear
			</Button>
		{/if}
	</div>

	{#if params.user}
		<p class="scope">
			Showing one user's activity. <button type="button" onclick={() => pick({ user: '' })}>
				Show everyone
			</button>
		</p>
	{/if}

	<div class="scroll">
		{#if events.data.length === 0}
			<p class="empty">Nothing recorded{filtered ? ' for these filters' : ' yet'}.</p>
		{:else}
			<ul>
				{#each events.data as row (row.id)}
					<EventRow {row} onuser={(user) => pick({ user })} />
				{/each}
			</ul>
		{/if}
	</div>

	<Pager of={events} onchange={(page) => params.update({ page })} />
</div>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6em;
		margin-bottom: 1em;
	}

	.scope {
		margin: 0 0 1em;
		font-size: 0.9em;
		color: var(--muted);
	}

	.scope button {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: var(--accent);
		cursor: pointer;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	.empty {
		color: var(--dim);
	}

</style>
