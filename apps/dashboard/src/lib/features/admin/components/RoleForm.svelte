<script lang="ts">
	import { FormBoundary, Issue, Select, Status, modal } from '@template/ui';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import { invalidate } from '$lib/query';
	import { assignRole } from '../api/admin.remote';

	let { row, self }: { row: User.Info; self: boolean } = $props();

	const assign = $derived(assignRole.for(row.id));
	const roles = Permission.roles.map((role) => ({ value: role, label: role }));
	const failed = $derived(!!assign.fields.allIssues()?.length);
	// The role being asked about, for the confirm body.
	let next = $state('');

	// An arrow key on a focused select fires `change`, so nothing commits without a yes.
	async function pick(e: Event & { currentTarget: HTMLSelectElement }) {
		const el = e.currentTarget;
		next = el.value;
		const ok = await modal.confirm({
			title: `Make ${row.name} ${next}`,
			action: 'Change role',
			body: change
		});
		if (ok) return el.form?.requestSubmit();
		el.value = row.role;
	}
</script>

{#snippet change()}
	Their permissions change on their next request, from <b>{row.role}</b> to <b>{next}</b>.
{/snippet}

<!-- Your own row is read-only: core refuses to let an admin demote themselves. -->
{#if self}
	<span class="role">{row.role}</span>
{:else}
	<FormBoundary>
		{#each assign.fields.allIssues() ?? [] as issue (issue)}
			<Issue>{issue.message}</Issue>
		{/each}

		<form
			{...assign.enhance(async (form) => {
				await form.submit();
				await invalidate(['users']);
			})}
		>
			<input {...assign.fields.id.as('hidden', row.id)} />
			<span class="pick">
				<Select
					options={roles}
					{...assign.fields.role.as('select', row.role)}
					disabled={!!assign.pending}
					onchange={pick}
					aria-label="Role for {row.name}"
				/>
			</span>
			<Status state={assign.pending ? 'pending' : failed ? 'failed' : 'idle'} />
		</form>
	</FormBoundary>
{/if}

<style>
	.pick {
		display: flex;
		width: 9em;
	}

	form {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.role {
		font-size: 0.85em;
		color: var(--muted);
	}
</style>
