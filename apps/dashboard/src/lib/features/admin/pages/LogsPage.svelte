<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { Button, Fill, Input, Issue, LazySelect, Pagination, Scroll, Skeleton, Toggle } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { debounce } from '$lib/utils/debounce';
	import { fmt } from '$lib/utils/fmt';
	import { query } from '$lib/utils/params';
	import { events as entries, facets } from '../api/admin.query';
	import LogsTable from '../components/LogsTable.svelte';
	import { filters } from '../filters';
	import { keys } from '../sort';

	// In the URL so a narrowed log can be linked, reloaded and stepped back through.
	const params = query(filters.events.schema);

	const f = fmt();
	const client = useQueryClient();
	const log = createQuery(() => entries(filters.events.args(params)));
	const filtered = $derived(!!(params.q || params.type || params.source || params.user));

	// Read only by the two selects, when opened; both share the one cached query.
	const list = (key: 'types' | 'sources') => async () =>
		(await client.fetchQuery(facets()))[key].map((one) => ({ value: one, label: one }));

	// `undefined` drops the key, so narrowing always lands back on page one.
	const pick = (next: Partial<typeof params>) => params.update({ ...next, page: undefined });
	const commit = debounce((q: string) => pick({ q }), 300);
</script>

<!-- Header, filters and pagination hold still; only the list scrolls. -->
<Fill>
	<Header.Root title="Logs" lead="Every audit entry, newest first. Written by core; read-only here.">
		<Header.Item label="Entries">{log.data ? f.number(log.data.total) : '–'}</Header.Item>
		{#snippet strip()}
			<Header.Group>
				<Input
					type="search"
					aria-label="Search logs"
					placeholder="Search type or source id"
					value={params.q}
					oninput={(e) => commit(e.currentTarget.value)}
				/>
			</Header.Group>
			<Header.Group label="Type">
				<LazySelect
					aria-label="Type"
					value={params.type}
					options={[{ value: '', label: 'All types' }]}
					load={list('types')}
					onchange={(e) => pick({ type: e.currentTarget.value })}
				/>
			</Header.Group>
			<Header.Group label="Source">
				<LazySelect
					aria-label="Source"
					value={params.source}
					options={[{ value: '', label: 'All sources' }]}
					load={list('sources')}
					onchange={(e) => pick({ source: e.currentTarget.value })}
				/>
			</Header.Group>
			{#if params.user}
				<!-- Set from a row's user link; unpressing it is how the scope goes away. -->
				<Header.Group label="User">
					<Toggle pressed onclick={() => pick({ user: '' })}>One user ×</Toggle>
				</Header.Group>
			{/if}
			{#if filtered}
				<Header.Group end>
					<Button variant="ghost" onclick={() => pick({ q: '', type: '', source: '', user: '' })}>
						Clear filters
					</Button>
				</Header.Group>
			{/if}
		{/snippet}
	</Header.Root>

	{#if log.isSuccess}
		<Scroll fill>
			<LogsTable
				rows={log.data.data}
				sorting={keys.events.decode(params.sort)}
				onsort={(sort) => pick({ sort })}
				onuser={(user) => pick({ user })}
			/>
		</Scroll>
		<Pagination of={log.data} onchange={(page) => params.update({ page })} />
	{:else if log.isError}
		<Issue>{log.error.message}</Issue>
	{:else}
		<Skeleton h="12em" />
	{/if}
</Fill>
