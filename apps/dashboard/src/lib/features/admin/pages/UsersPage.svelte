<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Fill, Input, Issue, Pagination, Scroll, Skeleton, Toggle } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { debounce } from '$lib/utils/debounce';
	import { query } from '$lib/utils/params';
	import { users as list } from '../api/admin.query';
	import UsersTable from '../components/UsersTable.svelte';
	import { filters } from '../filters';
	import { keys } from '../sort';

	// In the URL, like the log: a narrowed list can be linked, reloaded and stepped back through.
	const params = query(filters.users.schema);

	const page = createQuery(() => list(filters.users.args(params)));

	// `undefined` drops the key, so every narrowing lands back on page one.
	const pick = (next: Partial<typeof params>) => params.update({ ...next, page: undefined });
	const commit = debounce((q: string) => pick({ q }), 300);
</script>

<!-- Same shape as the log: header and filters hold still, only the list scrolls. -->
<Fill>
	<Header.Root title="Users">
		{#snippet strip()}
			<Header.Group>
				<Input
					type="search"
					name="search"
					autocomplete="off"
					aria-label="Search users"
					placeholder="Search name or email"
					value={params.q}
					oninput={(e) => commit(e.currentTarget.value)}
				/>
			</Header.Group>
			<Header.Group label="Show">
				<Toggle pressed={params.deleted} onclick={(on) => pick({ deleted: on })}>Disabled</Toggle>
			</Header.Group>
			{#if params.q || params.deleted}
				<Header.Group end>
					<Button variant="ghost" onclick={() => pick({ q: '', deleted: false })}>
						Clear filters
					</Button>
				</Header.Group>
			{/if}
		{/snippet}
	</Header.Root>

	{#if page.isSuccess}
		<Scroll fill>
			<UsersTable
				rows={page.data.data}
				sorting={keys.users.decode(params.sort)}
				onsort={(sort) => pick({ sort })}
			/>
		</Scroll>
		<Pagination of={page.data} onchange={(next) => params.update({ page: next })} label="users" />
	{:else if page.isError}
		<Issue>{page.error.message}</Issue>
	{:else}
		<Skeleton h="12em" />
	{/if}
</Fill>
