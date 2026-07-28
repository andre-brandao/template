<script lang="ts">
	import { Button, Issues, Select, Spinner } from '@template/ui';
	import type { Role } from '@template/core/organization/role';
	import Avatar from '$lib/components/Avatar.svelte';
	import { assignRole, getMembers, removeMember } from '../api/members.remote';

	let {
		member,
		roles,
		manage,
		self
	}: {
		member: Awaited<ReturnType<typeof getMembers>>[number];
		roles: Role.Info[];
		manage: boolean;
		self: boolean;
	} = $props();

	const assign = $derived(assignRole.for(member.id));
	const removal = $derived(removeMember.for(member.id));
</script>

<tr>
	<td>
		<div class="who">
			<Avatar name={member.name} image={member.image} />
			<div class="id">
				<span class="name">
					{member.name}
					{#if self}
						<span class="badge">you</span>
					{/if}
				</span>
				<span class="email">{member.email}</span>
			</div>
		</div>
	</td>
	<td>
		{#if manage && !self}
			<!-- Core guards own-role changes and the last owner; the select just
			     submits on change and surfaces whatever comes back. -->
			<form class="assign" {...assign}>
				<input type="hidden" name="id" value={member.id} />
				<Select
					name="roleID"
					disabled={!!assign.pending}
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				>
					{#each roles as role (role.id)}
						<option value={role.id} selected={role.id === member.roleID}>
							{role.name}
						</option>
					{/each}
				</Select>
				{#if assign.pending}<Spinner />{/if}
			</form>
			<Issues of={assign.fields.allIssues()} />
		{:else}
			<span class="role">{member.role.name}</span>
		{/if}
	</td>
	{#if manage}
		<td class="end">
			{#if !self}
				<form
					{...removal.enhance(async (f) => {
						if (!confirm(`Remove ${member.name} from the organization?`)) return;
						await f.submit();
					})}
				>
					<input type="hidden" name="id" value={member.id} />
					<Button variant="danger" type="submit" pending={!!removal.pending}>
						Remove
					</Button>
				</form>
				<Issues of={removal.fields.allIssues()} />
			{/if}
		</td>
	{/if}
</tr>

<style>
	td {
		padding: 0.55em 0.6em;
		border-top: 1px solid var(--border);
	}

	.who {
		display: flex;
		align-items: center;
		gap: 0.6em;
	}

	.id {
		display: flex;
		flex-direction: column;
		gap: 0.1em;
	}

	.name {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-weight: 600;
	}

	.email {
		font-size: 0.78em;
		color: var(--dim);
	}

	.role {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--muted);
	}

	.assign {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.end {
		text-align: right;
	}
</style>
