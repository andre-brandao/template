<script lang="ts">
	import { FormBoundary, Issue, Select, Status, modal } from '@template/ui';
	import { Workspace } from '@template/core/workspace';
	import { invalidate } from '#lib/query.ts';
	import { setRole } from '../api/workspaces.remote';

	let { row }: { row: { userID: string; name: string; role: Workspace.Role } } = $props();

	const assign = $derived(setRole.for(row.userID));
	const roles = Workspace.roles.map((role) => ({ value: role, label: role }));
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
	Their role in this workspace changes from <b>{row.role}</b> to <b>{next}</b>.
{/snippet}

<FormBoundary>
	{#each assign.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		{...assign.enhance(async (form) => {
			await form.submit();
			await invalidate(['workspaces']);
		})}
	>
		<input {...assign.fields.userID.as('hidden', row.userID)} />
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
</style>
