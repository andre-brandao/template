<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Button, FormBoundary, Modal, Select } from '@template/ui';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import Avatar from '$lib/components/Avatar.svelte';
	import { user } from '$lib/utils/context';
	import { assignRole, disableUser, enableUser } from '../api/admin.remote';

	let { row, onchange }: { row: User.Row; onchange: () => void } = $props();

	const me = user();
	// Your own row is read-only: core refuses to let an admin demote or disable themselves,
	// so offering the controls would only ever produce an error.
	const self = $derived(row.id === me.current?.id);

	let open = $state(false);

	const assign = $derived(assignRole.for(row.id));
	const toggle = $derived((row.timeDeleted ? enableUser : disableUser).for(row.id));
	const issues = $derived([...(assign.fields.allIssues() ?? []), ...(toggle.fields.allIssues() ?? [])]);

	const roles = Permission.roles.map((role) => ({ value: role, label: role }));

	// Closing on the way out puts any failure back on the row, where the issue list already is.
	const enhance = $derived(
		toggle.enhance(async (f) => {
			await f.submit();
			open = false;
			onchange();
		})
	);
</script>

<li class:gone={!!row.timeDeleted}>
	<Avatar name={row.name} image={row.image} />

	<div class="who">
		<span class="name">{row.name}{#if self}<span class="tag">you</span>{/if}</span>
		<span class="email">{row.email}</span>
	</div>

	<FormBoundary>
		{#each issues as issue (issue)}
			<p class="error">{issue.message}</p>
		{/each}

		<div class="acts">
			{#if self}
				<span class="role">{row.role}</span>
			{:else}
				<form
					{...assign.enhance(async (f) => {
						await f.submit();
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

				<!-- Restoring an account needs no warning; taking one away does. -->
				{#if row.timeDeleted}
					<form {...enhance}>
						<input {...toggle.fields.id.as('hidden', row.id)} />
						<Button type="submit" pending={!!toggle.pending}>Enable</Button>
					</form>
				{:else}
					<button class="drop" type="button" onclick={() => (open = true)} title="Disable user">
						<Trash2 size={16} />
					</button>
				{/if}
			{/if}
		</div>

		<Modal bind:open>
			<h2>Disable account</h2>

			<p class="warn">
				<b>{row.name}</b> is turned away at login on their next request and drops out of every actor
				lookup. Nothing they filed is deleted, and enabling the account again restores access.
			</p>

			<form {...enhance}>
				<input {...toggle.fields.id.as('hidden', row.id)} />

				<div class="foot">
					<Button variant="ghost" type="button" onclick={() => (open = false)}>Cancel</Button>
					<Button variant="danger" type="submit" pending={!!toggle.pending}>Disable account</Button>
				</div>
			</form>
		</Modal>
	</FormBoundary>
</li>

<style>
	li {
		display: flex;
		align-items: center;
		gap: 0.85em;
		padding: 0.7em 0.9em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	/* Disabled accounts stay legible but visibly inert — they're listed to be restored. */
	.gone {
		opacity: 0.55;
	}

	.who {
		display: flex;
		flex-direction: column;
		min-width: 0;
		margin-right: auto;
	}

	.name {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-weight: 500;
	}

	.tag {
		font-size: 0.7em;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.15em 0.45em;
		border-radius: 999px;
		background: var(--raised, var(--border));
		color: var(--muted);
	}

	.email,
	.role {
		font-size: 0.85em;
		color: var(--muted);
	}

	.acts {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.drop {
		display: grid;
		place-items: center;
		padding: 0.5em;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) - 2px);
		background: var(--bg);
		color: var(--dim);
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.drop:hover {
		border-color: var(--danger, #c0392b);
		color: var(--danger, #c0392b);
	}

	h2 {
		margin: 0 0 0.6em;
		font-size: 1.1em;
	}

	.warn {
		margin: 0 0 1.25em;
		color: var(--muted);
		font-size: 0.9em;
		line-height: 1.55;
	}

	.warn b {
		color: var(--ink);
		font-weight: 600;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 0.6em;
		margin-top: 1.25em;
	}

	.error {
		margin: 0 0 0.4em;
		font-size: 0.85em;
		color: var(--danger, #c0392b);
	}
</style>
