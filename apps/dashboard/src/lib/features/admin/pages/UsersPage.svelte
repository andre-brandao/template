<script lang="ts">
	import { Input, Pager } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import { debounce } from '$lib/utils/debounce';
	import { getUsers } from '../api/admin.remote';
	import UserRow from '../components/UserRow.svelte';

	let search = $state('');
	let deleted = $state(false);
	let at = $state(1);

	// `undefined` rather than empty/false so the query key stays stable while typing nothing.
	const args = $derived({
		search: search || undefined,
		deleted: deleted || undefined,
		page: at,
		pageSize: 20
	});
	const users = $derived(await getUsers(args));

	// Typing resets to the first page — page 4 of the old result set means nothing here.
	const commit = debounce((value: string) => {
		search = value;
		at = 1;
	}, 300);
</script>

<!-- Same shape as the log: header and filters hold still, only the list scrolls. -->
<div class="fill">
	<Header title="Users">
		Everyone with an account on this instance. Changing a role takes effect on that person's
		next request; disabling one turns them away at login and hides them from every actor lookup.
	</Header>

	<div class="bar">
		<Input
			type="search"
			placeholder="Search name or email"
			oninput={(e) => commit(e.currentTarget.value)}
		/>
		<label class="show">
			<input
				type="checkbox"
				checked={deleted}
				onchange={(e) => {
					deleted = e.currentTarget.checked;
					at = 1;
				}}
			/>
			Show disabled
		</label>
	</div>

	<div class="scroll">
		{#if users.data.length === 0}
			<p class="empty">No users match.</p>
		{:else}
			<ul>
				{#each users.data as row (row.id)}
					<UserRow {row} onchange={() => getUsers(args).refresh()} />
				{/each}
			</ul>
		{/if}
	</div>

	<Pager of={users} onchange={(page) => (at = page)} label="users" />
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-bottom: 1em;
	}

	.show {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.9em;
		color: var(--muted);
		white-space: nowrap;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.empty {
		color: var(--dim);
	}

</style>
