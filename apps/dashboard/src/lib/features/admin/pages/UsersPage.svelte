<script lang="ts">
	import { Button, Fill, Input, Pagination, Scroll, Toggle } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { debounce } from '$lib/utils/debounce';
	import { getUsers } from '../api/admin.remote';
	import UsersTable from '../components/UsersTable.svelte';
	import { users } from '../sort';

	let search = $state('');
	let deleted = $state(false);
	let at = $state(1);
	// Local, not the URL: this page keeps every control in component state.
	let keys = $state<ReturnType<typeof users.encode>>([]);

	// `undefined` rather than empty/false so the query key stays stable while typing nothing.
	const args = $derived({
		search: search || undefined,
		deleted: deleted || undefined,
		page: at,
		pageSize: 20,
		sort: keys
	});
	const page = $derived(await getUsers(args));

	// Every narrowing lands back on page one — page 4 of the old result set means nothing here.
	function pick(next: { search?: string; deleted?: boolean }) {
		search = next.search ?? search;
		deleted = next.deleted ?? deleted;
		at = 1;
	}
	const commit = debounce((value: string) => pick({ search: value }), 300);
</script>

<!-- Same shape as the log: header and filters hold still, only the list scrolls. -->
<Fill>
	<Header.Root title="Users">
		<Header.Item label={deleted ? 'Users' : 'Active'}>{page.total.toLocaleString()}</Header.Item>
		{#snippet strip()}
			<Header.Group>
				<Input
					type="search"
					name="search"
					autocomplete="off"
					aria-label="Search users"
					placeholder="Search name or email"
					value={search}
					oninput={(e) => commit(e.currentTarget.value)}
				/>
			</Header.Group>
			<Header.Group label="Show">
				<Toggle pressed={deleted} onclick={(on) => pick({ deleted: on })}>Disabled</Toggle>
			</Header.Group>
			{#if search || deleted}
				<Header.Group end>
					<Button variant="ghost" onclick={() => pick({ search: '', deleted: false })}>
						Clear filters
					</Button>
				</Header.Group>
			{/if}
		{/snippet}
	</Header.Root>

	<Scroll fill>
		<UsersTable
			rows={page.data}
			sorting={users.decode(keys)}
			onsort={(next) => {
				keys = next;
				at = 1;
			}}
			onchange={() => getUsers(args).refresh()}
		/>
	</Scroll>

	<Pagination of={page} onchange={(next) => (at = next)} label="users" />
</Fill>
