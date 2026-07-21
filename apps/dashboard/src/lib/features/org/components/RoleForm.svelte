<script lang="ts">
	import { Button, FormBoundary, Input, Issues } from '@template/ui';
	import { createRole, updateRole } from '../api/roles.remote';
	import { permissions } from '../permissions';

	let {
		role,
		onsuccess
	}: {
		role?: { id: string; name: string; permissions: string[] };
		onsuccess?: () => void;
	} = $props();
</script>

{#snippet inputs()}
	<label class="field">
		<span>Name</span>
		<Input name="name" value={role?.name ?? ''} placeholder="e.g. editor" />
	</label>
	<fieldset>
		<legend>Permissions</legend>
		<div class="grid">
			{#each permissions as perm (perm)}
				<label class="perm">
					<input
						type="checkbox"
						name="permissions"
						value={perm}
						checked={role?.permissions.includes(perm) ?? false}
					/>
					<code>{perm}</code>
				</label>
			{/each}
		</div>
	</fieldset>
{/snippet}

<FormBoundary>
	{#if role}
		<Issues of={updateRole.fields.allIssues()} />

		<form
			{...updateRole.enhance(async (f) => {
				await f.submit();
				onsuccess?.();
			})}
		>
			<input {...updateRole.fields.id.as('hidden', role.id)} />
			{@render inputs()}
			<Button type="submit" pending={!!updateRole.pending}>Save</Button>
		</form>
	{:else}
		<Issues of={createRole.fields.allIssues()} />

		<form
			{...createRole.enhance(async (f) => {
				await f.submit();
				onsuccess?.();
			})}
		>
			{@render inputs()}
			<Button type="submit" pending={!!createRole.pending}>Create</Button>
		</form>
	{/if}
</FormBoundary>

<style>
	form {
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

	.field span,
	legend {
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--muted);
	}

	fieldset {
		align-self: stretch;
		margin: 0;
		padding: 0.75em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9em, 1fr));
		gap: 0.45em 0.75em;
	}

	.perm {
		display: flex;
		align-items: center;
		gap: 0.45em;
		cursor: pointer;
	}

	.perm input {
		accent-color: var(--accent);
	}

	.perm code {
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
	}

	.perm:has(input:checked) code {
		color: var(--ink);
	}
</style>
