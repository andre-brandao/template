<script lang="ts">
	import { Button, Card, Drawer, FormBoundary, Input, Issues } from '@template/ui';
	import { org } from '../context';
	import { renameOrg } from '../api/org.remote';
	import { leaveOrg } from '../api/members.remote';
	import Can from '../components/Can.svelte';
	import MemberTable from '../components/MemberTable.svelte';
	import RoleList from '../components/RoleList.svelte';
	import InviteForm from '../components/InviteForm.svelte';
	import InvitationList from '../components/InvitationList.svelte';

	const ctx = org();

	let inviting = $state(false);
</script>

<h1>Settings</h1>

<div class="sections">
	<Card>
		<h2>General</h2>
		<FormBoundary>
			<Can perm="org:manage">
				<Issues of={renameOrg.fields.allIssues()} />

				<form class="rename" {...renameOrg}>
					<label class="field">
						<span>Name</span>
						<Input name="name" value={ctx.current?.name ?? ''} placeholder="e.g. acme" />
					</label>
					<Button type="submit" pending={!!renameOrg.pending}>Save</Button>
				</form>

				{#snippet otherwise()}
					<p class="name">{ctx.current?.name}</p>
				{/snippet}
			</Can>
		</FormBoundary>
	</Card>

	<Can perm="member:read">
		<Card>
			<div class="head">
				<h2>Members</h2>
				<Can perm="invite:manage">
					<Button onclick={() => (inviting = true)}>Invite</Button>
				</Can>
			</div>
			<MemberTable />
			<Can perm="invite:manage">
				<h3>Pending invitations</h3>
				<InvitationList />
			</Can>
		</Card>

		<Card>
			<h2>Roles</h2>
			<RoleList />
		</Card>
	</Can>

	<Card accent="var(--danger, crimson)">
		<h2>Danger zone</h2>
		<p class="hint">
			Leaving removes your access to this organization. An owner can invite you back.
		</p>
		<FormBoundary>
			<Issues of={leaveOrg.fields.allIssues()} />

			<form
				{...leaveOrg.enhance(async (f) => {
					if (!confirm('Leave this organization?')) return;
					await f.submit();
				})}
			>
				<Button variant="danger" type="submit" pending={!!leaveOrg.pending}>
					Leave organization
				</Button>
			</form>
		</FormBoundary>
	</Card>
</div>

<Drawer bind:open={inviting}>
	<h2 class="drawer">Invite a teammate</h2>
	<InviteForm onsuccess={() => (inviting = false)} />
</Drawer>

<style>
	h1 {
		margin: 0 0 1em;
		font-size: 1.4em;
	}

	h2 {
		margin: 0 0 0.9em;
		font-size: 1.1em;
	}

	h3 {
		margin: 1.5em 0 0.6em;
		font-family: var(--font-mono);
		font-size: 0.78em;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin-bottom: 0.9em;
	}

	.head h2 {
		margin: 0;
	}

	.rename {
		display: flex;
		align-items: end;
		flex-wrap: wrap;
		gap: 0.6em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		flex: 1 1 14em;
		max-width: 24em;
	}

	.field span {
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--muted);
	}

	.name {
		margin: 0;
		font-weight: 600;
	}

	.hint {
		margin: 0 0 1em;
		color: var(--muted);
		font-size: 0.9em;
	}

	.drawer {
		margin: 0 0 1em;
		font-size: 1.15em;
	}
</style>
