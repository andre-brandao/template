<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { FormBoundary, Select, Spinner, modal } from '@template/ui';
	import { Permission } from '@template/core/permission';
	import type { User } from '@template/core/user';
	import Avatar from '$lib/components/Avatar.svelte';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { assignRole, disableUser, enableUser } from '../api/admin.remote';

	let { row, onchange }: { row: User.Row; onchange: () => void } = $props();

	const me = user();
	const f = fmt();
	// Your own row is read-only: core refuses to let an admin demote or disable themselves,
	// so offering the controls would only ever produce an error.
	const self = $derived(row.id === me.current?.id);

	let copied = $state(false);

	const assign = $derived(assignRole.for(row.id));
	const toggle = $derived((row.timeDeleted ? enableUser : disableUser).for(row.id));
	const issues = $derived([
		...(assign.fields.allIssues() ?? []),
		...(toggle.fields.allIssues() ?? []),
	]);

	const roles = Permission.roles.map((role) => ({ value: role, label: role }));

	function copy() {
		navigator.clipboard.writeText(row.email);
		copied = true;
		setTimeout(() => (copied = false), 1200);
	}
</script>

{#snippet warn()}
	<b>{row.name}</b> is turned away at login on their next request and drops out of every actor
	lookup. Nothing they filed is deleted, and enabling the account again restores access.
{/snippet}

<li class:gone={!!row.timeDeleted}>
	<Avatar name={row.name} image={row.image} />

	<div class="who">
		<span class="name">{row.name}{#if self}<span class="tag">you</span>{/if}</span>
		<span class="email">
			{row.email}
			<button class="copy" type="button" onclick={copy} title={copied ? 'Copied' : 'Copy email'}>
				{#if copied}<Check size={13} />{:else}<Copy size={13} />{/if}
			</button>
		</span>
	</div>

	<FormBoundary>
		{#each issues as issue (issue)}
			<p class="error">{issue.message}</p>
		{/each}

		<div class="acts">
			{#if row.timeDeleted}
				<span class="off" title={f.stamp(row.timeDeleted)}>
					Disabled {f.ago(row.timeDeleted)}
				</span>
			{/if}

			{#if self}
				<span class="role">{row.role}</span>
			{:else}
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

				<!-- One form either way; the enhance gates the destructive direction on a confirm. -->
				<form
					{...toggle.enhance(async (form) => {
						// Restoring an account needs no warning; taking one away does.
						const ok =
							!!row.timeDeleted ||
							(await modal.confirm({
								title: 'Disable account',
								action: 'Disable account',
								body: warn
							}));
						if (!ok) return;
						await form.submit();
						onchange();
					})}
				>
					<input {...toggle.fields.id.as('hidden', row.id)} />
					{#if row.timeDeleted}
						<button class="back" type="submit" disabled={!!toggle.pending} title="Restore access">
							{#if toggle.pending}<Spinner />{:else}<RotateCcw size={14} />{/if}
							Enable
						</button>
					{:else}
						<button class="drop" type="submit" disabled={!!toggle.pending} title="Disable user">
							<Trash2 size={16} />
						</button>
					{/if}
				</form>
			{/if}
		</div>
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

	.email {
		display: flex;
		align-items: center;
		gap: 0.35em;
	}

	/* Dim until the row is hovered — the address is the content here, the button is a convenience. */
	.copy {
		display: grid;
		place-items: center;
		padding: 0.15em;
		border: 0;
		border-radius: calc(var(--radius) - 3px);
		background: none;
		color: var(--dim);
		cursor: pointer;
		opacity: 0.4;
		transition: opacity 0.15s ease;
	}

	li:hover .copy,
	.copy:focus-visible {
		opacity: 1;
	}

	.copy:hover {
		color: var(--ink);
	}

	.acts {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.off {
		font-size: 0.75em;
		font-family: var(--font-mono);
		color: var(--dim);
		white-space: nowrap;
	}

	.drop,
	.back {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		padding: 0.5em;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) - 2px);
		background: var(--bg);
		color: var(--dim);
		font: inherit;
		font-size: 0.85em;
		cursor: pointer;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.drop:hover {
		border-color: var(--danger, #c0392b);
		color: var(--danger, #c0392b);
	}

	.back {
		padding: 0.45em 0.7em;
	}

	.back:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.back:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.error {
		margin: 0 0 0.4em;
		font-size: 0.85em;
		color: var(--danger, #c0392b);
	}
</style>
