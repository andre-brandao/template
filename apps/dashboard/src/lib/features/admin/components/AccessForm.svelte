<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { FormBoundary, Spinner, modal } from '@template/ui';
	import type { User } from '@template/core/user';
	import { fmt } from '$lib/utils/fmt';
	import { disableUser, enableUser } from '../api/admin.remote';

	let { row, self, onchange }: { row: User.Info; self: boolean; onchange: () => void } = $props();

	const f = fmt();
	const toggle = $derived((row.timeDeleted ? enableUser : disableUser).for(row.id));

	// Restoring an account needs no warning; taking one away does.
	function ask() {
		if (row.timeDeleted) return true;
		return modal.confirm({ title: 'Disable account', action: 'Disable account', body: warn });
	}
</script>

{#snippet warn()}
	<b>{row.name}</b> is turned away at login on their next request and drops out of every actor
	lookup. Nothing they filed is deleted, and enabling the account again restores access.
{/snippet}

<FormBoundary>
	{#each toggle.fields.allIssues() ?? [] as issue (issue)}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="acts">
		{#if row.timeDeleted}
			<span class="off" title={f.stamp(row.timeDeleted)}>Disabled {f.ago(row.timeDeleted)}</span>
		{/if}

		<!-- Core refuses to let an admin disable themselves, so the control is not offered. -->
		{#if !self}
			<!-- One form either way; the enhance gates the destructive direction on a confirm. -->
			<form
				{...toggle.enhance(async (form) => {
					if (!(await ask())) return;
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

<style>
	.acts {
		display: flex;
		align-items: center;
		justify-content: flex-end;
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
