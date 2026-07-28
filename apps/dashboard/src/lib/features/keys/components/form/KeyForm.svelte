<script lang="ts">
	import { Button, FormBoundary, Input, Select } from '@template/ui';
	import type { Role } from '@template/core/organization/role';
	import { createKey } from '../../api/keys.remote';

	// Roles come from the page — empty when the actor can't read members.
	let { roles, onsuccess }: { roles: Role.Info[]; onsuccess?: () => void } = $props();
</script>

<FormBoundary>
	{#each createKey.fields.allIssues() ?? [] as issue (issue)}
		<p class="error">{issue.message}</p>
	{/each}

	<form
		class="add"
		{...createKey.enhance(async (f) => {
			await f.submit();
			onsuccess?.();
		})}
	>
		<label class="field name">
			<span>Name</span>
			<Input placeholder="e.g. laptop" {...createKey.fields.name.as('text')} />
		</label>
		{#if roles.length}
			<label class="field role">
				<span>Role</span>
				<Select name="roleID">
					<option value="">Your role</option>
					{#each roles as role (role.id)}
						<option value={role.id}>{role.name}</option>
					{/each}
				</Select>
			</label>
		{/if}
		<label class="field ttl">
			<span>Expires</span>
			<Select name="ttl">
				<option value="">Never expires</option>
				<option value="30">30 days</option>
				<option value="90">90 days</option>
				<option value="365">1 year</option>
			</Select>
		</label>
		<Button type="submit" pending={!!createKey.pending}>Create</Button>
	</form>
</FormBoundary>

<style>
	.add {
		display: flex;
		align-items: end;
		flex-wrap: wrap;
		gap: 0.6em;
		margin-bottom: 1.5em;
	}

	.name {
		flex: 1 1 14em;
	}

	.role,
	.ttl {
		flex: 0 1 auto;
	}
</style>
