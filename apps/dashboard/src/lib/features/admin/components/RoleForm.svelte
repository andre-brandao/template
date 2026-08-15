<script lang="ts">
	import { FormBoundary, Select } from '@template/ui';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import { assignRole } from '../api/admin.remote';

	let { row, self, onchange }: { row: User.Info; self: boolean; onchange: () => void } = $props();

	const assign = $derived(assignRole.for(row.id));
	const roles = Permission.roles.map((role) => ({ value: role, label: role }));
</script>

<!-- Your own row is read-only: core refuses to let an admin demote themselves, so offering
     the control would only ever produce an error. -->
{#if self}
	<span class="role">{row.role}</span>
{:else}
	<FormBoundary>
		{#each assign.fields.allIssues() ?? [] as issue (issue)}
			<p class="error">{issue.message}</p>
		{/each}

		<form
			{...assign.enhance(async (form) => {
				await form.submit();
				onchange();
			})}
		>
			<input {...assign.fields.id.as('hidden', row.id)} />
			<Select
				options={roles}
				{...assign.fields.role.as('select', row.role)}
				disabled={!!assign.pending}
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			/>
		</form>
	</FormBoundary>
{/if}

<style>
	.role {
		font-size: 0.85em;
		color: var(--muted);
	}

	.error {
		margin: 0 0 0.4em;
		font-size: 0.85em;
		color: var(--danger, #c0392b);
	}
</style>
