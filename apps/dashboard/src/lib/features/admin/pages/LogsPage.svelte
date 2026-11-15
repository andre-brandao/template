<script lang="ts">
	import { z } from 'zod';
	import { Button, Fill, Input, LazySelect, Pagination, Scroll, Toggle } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { debounce } from '$lib/utils/debounce';
	import { query } from '$lib/utils/params';
	import { getEvents, getFacets } from '../api/admin.remote';
	import LogsTable from '../components/LogsTable.svelte';
	import { events } from '../sort';

	// Filters live in the URL so a narrowed log can be linked, reloaded and stepped back
	// through — the same treatment insights gives its date range.
	const params = query(
		z.object({
			q: z.string().default(''),
			type: z.string().default(''),
			source: z.string().default(''),
			user: z.string().default(''),
			page: z.coerce.number().int().min(1).default(1),
			sort: events.schema
		})
	);

	const args = $derived({
		search: params.q || undefined,
		type: params.type || undefined,
		source: params.source || undefined,
		userID: params.user || undefined,
		page: params.page,
		pageSize: 50,
		sort: params.sort
	});
	const log = $derived(await getEvents(args));
	const filtered = $derived(!!(params.q || params.type || params.source || params.user));

	// The facet lists are only ever read by the two selects, so they ride along with them
	// instead of holding up the log. Both halves come from the one cached query.
	const list = (key: 'types' | 'sources') => async () =>
		(await getFacets())[key].map((one) => ({ value: one, label: one }));

	// `undefined` drops the key entirely, so narrowing always lands back on page one and the
	// URL stays as short as the filters actually in use.
	const pick = (next: Partial<typeof params>) => params.update({ ...next, page: undefined });
	const commit = debounce((q: string) => pick({ q }), 300);
</script>

<!-- Header, filters and pagination hold still; only the list scrolls. A log is read by
     narrowing it, so the controls that narrow it have to stay in reach. -->
<Fill>
	<Header.Root title="Logs" lead="Every audit entry, newest first. Written by core; read-only here.">
		<Header.Item label="Entries">{log.total.toLocaleString()}</Header.Item>
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

	<Scroll fill>
		<LogsTable
			rows={log.data}
			sorting={events.decode(params.sort)}
			onsort={(sort) => pick({ sort })}
			onuser={(user) => pick({ user })}
		/>
	</Scroll>

	<Pagination of={log} onchange={(page) => params.update({ page })} />
</Fill>
