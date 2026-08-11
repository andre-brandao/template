<script lang="ts">
	import { Button, Input } from '@template/ui';
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
	const pages = $derived(Math.max(1, Math.ceil(users.total / users.pageSize)));

	// Typing resets to the first page — page 4 of the old result set means nothing here.
	const commit = debounce((value: string) => {
		search = value;
		at = 1;
	}, 300);
</script>

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

{#if users.data.length === 0}
	<p class="empty">No users match.</p>
{:else}
	<ul>
		{#each users.data as row (row.id)}
			<UserRow {row} onchange={() => getUsers(args).refresh()} />
		{/each}
	</ul>
{/if}

{#if pages > 1}
	<nav class="pager">
		<Button disabled={at <= 1} onclick={() => (at -= 1)}>Previous</Button>
		<span>Page {users.page} of {pages} · {users.total} total</span>
		<Button disabled={at >= pages} onclick={() => (at += 1)}>Next</Button>
	</nav>
{/if}

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

	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin-top: 1.25em;
		font-size: 0.9em;
		color: var(--muted);
	}
</style>
