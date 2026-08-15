<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { createTable, renderComponent, renderSnippet } from '@tanstack/svelte-table';
	import type { ColumnDef, Row } from '@tanstack/svelte-table';
	import { DataTable, features } from '@template/ui';
	import type { User } from '@template/core/user';
	import Avatar from '$lib/components/Avatar.svelte';
	import { user } from '$lib/utils/context';
	import RoleForm from './RoleForm.svelte';
	import AccessForm from './AccessForm.svelte';
	import { users } from '../sort';

	let {
		rows,
		sorting,
		onsort,
		onchange
	}: {
		rows: User.Info[];
		sorting: ReturnType<typeof users.decode>;
		onsort: (next: ReturnType<typeof users.encode>) => void;
		onchange: () => void;
	} = $props();

	const me = user();
	const self = (row: User.Info) => row.id === me.current?.id;

	// One id rather than a flag per row: only one address is ever freshly copied.
	let copied = $state<string | null>(null);

	function copy(email: string, id: string) {
		navigator.clipboard.writeText(email);
		copied = id;
		setTimeout(() => (copied = null), 1200);
	}

	type Cell = Row<typeof features, User.Info>;

	// The two form-heavy cells stay components: each owns a confirm snippet and its own form
	// boundary, neither of which a snippet in this file could hold per row.
	const cols: ColumnDef<typeof features, User.Info>[] = [
		{ id: 'name', header: 'Name', accessorFn: (one) => one.name, cell: ({ row }) => renderSnippet(name, row) },
		{ id: 'email', header: 'Email', accessorFn: (one) => one.email, cell: ({ row }) => renderSnippet(mail, row) },
		{
			id: 'role',
			header: 'Role',
			accessorFn: (one) => one.role,
			cell: ({ row }) =>
				renderComponent(RoleForm, { row: row.original, self: self(row.original), onchange })
		},
		{
			id: 'access',
			header: '',
			enableSorting: false,
			cell: ({ row }) =>
				renderComponent(AccessForm, { row: row.original, self: self(row.original), onchange })
		}
	];

	const table = createTable({
		features,
		columns: cols,
		get data() {
			return rows;
		},
		getRowId: (one) => one.id,
		state: {
			get sorting() {
				return sorting;
			}
		},
		onSortingChange: (next) =>
			onsort(users.encode(typeof next === 'function' ? next(sorting) : next)),
		manualSorting: true,
		maxMultiSortColCount: 3
	});
</script>

{#snippet name(row: Cell)}
	<span class="who" class:gone={!!row.original.timeDeleted}>
		<Avatar name={row.original.name} image={row.original.image} />
		<span class="name">
			{row.original.name}{#if self(row.original)}<span class="tag">you</span>{/if}
		</span>
	</span>
{/snippet}

{#snippet mail(row: Cell)}
	<span class="email">
		{row.original.email}
		<button
			class="copy"
			type="button"
			onclick={() => copy(row.original.email, row.original.id)}
			title={copied === row.original.id ? 'Copied' : 'Copy email'}
		>
			{#if copied === row.original.id}<Check size={13} />{:else}<Copy size={13} />{/if}
		</button>
	</span>
{/snippet}

<DataTable {table} empty="No users match." />

<style>
	.who {
		display: flex;
		align-items: center;
		gap: 0.6em;
	}

	/* Disabled accounts stay legible but visibly inert — they're listed to be restored. */
	.gone {
		opacity: 0.55;
	}

	.name {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-weight: 500;
	}

	.tag {
		font-size: 0.7em;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.15em 0.45em;
		border-radius: 999px;
		background: var(--raised, var(--border));
		color: var(--muted);
	}

	.email {
		display: flex;
		align-items: center;
		gap: 0.35em;
		font-size: 0.85em;
		color: var(--muted);
	}

	/* Dim until the row is hovered — the address is the content, the button a convenience. */
	.copy {
		display: grid;
		place-items: center;
		padding: 0.15em;
		border: 0;
		border-radius: calc(var(--radius) - 3px);
		background: none;
		color: var(--dim);
		cursor: pointer;
		opacity: 0.4;
		transition: opacity 0.15s ease;
	}

	:global(tr:hover) .copy,
	.copy:focus-visible {
		opacity: 1;
	}

	.copy:hover {
		color: var(--ink);
	}
</style>
