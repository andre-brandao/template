<script lang="ts">
	import { Button, Drawer, FormBoundary, Issues } from '@template/ui';
	import { org } from '../context';
	import { getMembers } from '../api/members.remote';
	import { getRoles, removeRole } from '../api/roles.remote';
	import RoleForm from './RoleForm.svelte';

	const ctx = org();
	const roles = $derived(await getRoles());
	// Same query the member table holds — counted here rather than aggregated
	// server-side, orgs are small.
	const members = $derived(await getMembers());
	const manage = $derived(ctx.can('role:manage'));

	let creating = $state(false);
	let editing = $state(false);
	let target: { id: string; name: string; permissions: string[] } | null = $state(null);
</script>

<FormBoundary>
	<Issues of={removeRole.fields.allIssues()} />

	{#if manage}
		<div class="bar">
			<Button onclick={() => (creating = true)}>New role</Button>
		</div>
	{/if}

	<ul>
		{#each roles as role (role.id)}
			{@const held = members.filter((m) => m.roleID === role.id).length}
			<li>
				<div class="meta">
					<span class="name">
						{role.name}
						{#if role.owner}
							<span class="badge">owner</span>
						{/if}
						<span class="count">{held} member{held === 1 ? '' : 's'}</span>
					</span>
					<div class="perms">
						{#each role.permissions as perm (perm)}
							<code>{perm}</code>
						{/each}
					</div>
				</div>
				{#if manage && !role.owner}
					<div class="actions">
						<Button
							onclick={() => {
								target = role;
								editing = true;
							}}
						>
							Edit
						</Button>
						<form
							{...removeRole.enhance(async (f) => {
								if (!confirm(`Delete the ${role.name} role?`)) return;
								await f.submit();
							})}
						>
							<input type="hidden" name="id" value={role.id} />
							<Button variant="danger" type="submit">Delete</Button>
						</form>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</FormBoundary>

<Drawer bind:open={creating}>
	<h2>New role</h2>
	<RoleForm onsuccess={() => (creating = false)} />
</Drawer>

<Drawer bind:open={editing}>
	<h2>Edit role</h2>
	{#if target}
		<RoleForm role={target} onsuccess={() => (editing = false)} />
	{/if}
</Drawer>

<style>
	.bar {
		display: flex;
		justify-content: end;
		margin-bottom: 0.6em;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	li {
		display: flex;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
		padding: 0.6em 0.2em;
		border-top: 1px solid var(--border);
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		min-width: 10em;
		flex: 1;
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

	.count {
		font-family: var(--font-mono);
		font-size: 0.72em;
		font-weight: 400;
		color: var(--dim);
	}

	.perms {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em;
	}

	.perms code {
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--muted);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.1em 0.4em;
		background: var(--surface-2);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}
</style>
