<script lang="ts">
	import { createTable, renderComponent } from '@tanstack/svelte-table';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { DataTable, features } from '@template/ui';
	import type { Workspaces } from '@template/core/workspaces';
	import MemberRole from './MemberRole.svelte';

	type Member = Awaited<ReturnType<typeof Workspaces.members>>[number];

	// `manager` swaps the role text for a select, except on `self`; core re-checks either way.
	let {
		rows,
		manager = false,
		self
	}: { rows: Member[]; manager?: boolean; self?: string } = $props();

	const cols: ColumnDef<typeof features, Member>[] = [
		{ id: 'name', header: 'Name', accessorFn: (one) => one.name },
		{ id: 'email', header: 'Email', accessorFn: (one) => one.email },
		{
			id: 'role',
			header: 'Role',
			accessorFn: (one) => one.role,
			cell: ({ row }) =>
				manager && row.original.userID !== self
					? renderComponent(MemberRole, { row: row.original })
					: row.original.role
		}
	];

	const table = createTable({
		features,
		columns: cols,
		get data() {
			return rows;
		},
		getRowId: (one) => one.userID
	});
</script>

<DataTable {table} empty="No members yet." />
