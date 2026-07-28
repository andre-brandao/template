<script lang="ts">
	import { Button, FormBoundary, Issues } from '@template/ui';
	import { getInvitations, revokeInvitation } from '../api/invitations.remote';
	import { getRoles } from '../api/roles.remote';

	const invites = $derived(await getInvitations());
	const roles = $derived(await getRoles());

	let copied: string | null = $state(null);

	function copy(token: string) {
		navigator.clipboard.writeText(`${location.origin}/invite/${token}`);
		copied = token;
		setTimeout(() => (copied = null), 1500);
	}
</script>

<FormBoundary>
	<Issues of={revokeInvitation.fields.allIssues()} />

	{#if invites.length === 0}
		<p class="empty">No pending invitations.</p>
	{:else}
		<ul class="rows">
			{#each invites as invite (invite.id)}
				<li>
					<div class="meta">
						<span class="email">{invite.email}</span>
						<span class="detail">
							{roles.find((r) => r.id === invite.roleID)?.name ?? invite.roleID} · expires
							{new Date(invite.timeExpires).toLocaleDateString()}
						</span>
					</div>
					<div class="actions">
						<Button onclick={() => copy(invite.token)}>
							{copied === invite.token ? 'Copied' : 'Copy link'}
						</Button>
						<form
							{...revokeInvitation.enhance(async (f) => {
								if (!confirm(`Revoke the invitation for ${invite.email}?`)) return;
								await f.submit();
							})}
						>
							<input type="hidden" name="id" value={invite.id} />
							<Button variant="danger" type="submit">Revoke</Button>
						</form>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</FormBoundary>

<style>
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		flex: 1;
		min-width: 12em;
	}

	.email {
		font-weight: 600;
	}

	.detail {
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--dim);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}

	.empty {
		color: var(--dim);
	}
</style>
