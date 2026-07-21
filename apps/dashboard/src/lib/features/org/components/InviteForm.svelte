<script lang="ts">
	import { Button, FormBoundary, Input, Issues } from '@template/ui';
	import { createInvitation } from '../api/invitations.remote';
	import { getRoles } from '../api/roles.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();

	const roles = $derived(await getRoles());
	const fallback = $derived(roles.find((r) => !r.owner)?.id);
</script>

<FormBoundary>
	<Issues of={createInvitation.fields.allIssues()} />

	<form
		class="add"
		{...createInvitation.enhance(async (f) => {
			await f.submit();
			// Business errors ("already a member", ...) land as issues — keep the
			// drawer open so they're visible.
			if (!createInvitation.fields.allIssues()?.length) onsuccess?.();
		})}
	>
		<label class="field">
			<span>Email</span>
			<Input type="email" name="email" placeholder="teammate@example.com" />
		</label>
		<label class="field">
			<span>Role</span>
			<select name="roleID">
				{#each roles as role (role.id)}
					<option value={role.id} selected={role.id === fallback}>{role.name}</option>
				{/each}
			</select>
		</label>
		<Button type="submit" pending={!!createInvitation.pending}>Send invitation</Button>
	</form>
</FormBoundary>

<style>
	.add {
		display: flex;
		flex-direction: column;
		align-items: start;
		gap: 1em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		align-self: stretch;
	}

	.field span {
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--muted);
	}

	select {
		min-width: 0;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	select:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
