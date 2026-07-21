<script lang="ts">
	import { Button, FormBoundary, Issues, Spinner } from '@template/ui';
	import Avatar from '$lib/components/Avatar.svelte';
	import { user } from '$lib/features/auth/context';
	import { org } from '../context';
	import { assignRole, getMembers, removeMember } from '../api/members.remote';
	import { getRoles } from '../api/roles.remote';

	const me = user();
	const ctx = org();
	const members = $derived(await getMembers());
	const roles = $derived(await getRoles());
	const manage = $derived(ctx.can('member:manage'));
</script>

<FormBoundary>
	<table>
		<thead>
			<tr>
				<th>Member</th>
				<th>Role</th>
				{#if manage}
					<th></th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each members as member (member.id)}
				{@const assign = assignRole.for(member.id)}
				{@const removal = removeMember.for(member.id)}
				{@const self = member.email === me.current?.email}
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
								<select
									name="roleID"
									disabled={!!assign.pending}
									onchange={(e) => e.currentTarget.form?.requestSubmit()}
								>
									{#each roles as role (role.id)}
										<option value={role.id} selected={role.id === member.roleID}>
											{role.name}
										</option>
									{/each}
								</select>
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
			{/each}
		</tbody>
	</table>
</FormBoundary>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		font-family: var(--font-mono);
		font-size: 0.78em;
		font-weight: 500;
		color: var(--dim);
		padding: 0 0.6em 0.5em;
	}

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

	.badge {
		font-family: var(--font-mono);
		font-size: 0.7em;
		font-weight: 500;
		color: var(--muted);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.1em 0.45em;
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

	select {
		min-width: 0;
		padding: 0.4em 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: 0.9em;
	}

	select:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.end {
		text-align: right;
	}
</style>
