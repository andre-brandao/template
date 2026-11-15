<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import UserX from '@lucide/svelte/icons/user-x';
	import { Button, FormBoundary, IconButton, Issue, Status, modal } from '@template/ui';
	import type { User } from '@template/core/user';
	import { invalidate } from '$lib/query';
	import { fmt } from '$lib/utils/fmt';
	import { disableUser, enableUser } from '../api/admin.remote';

	let { row, self }: { row: User.Info; self: boolean } = $props();

	const f = fmt();
	const toggle = $derived((row.timeDeleted ? enableUser : disableUser).for(row.id));
	const failed = $derived(!!toggle.fields.allIssues()?.length);

	// Restoring an account needs no warning; taking one away does.
	function ask() {
		if (row.timeDeleted) return true;
		return modal.confirm({ title: 'Disable account', action: 'Disable account', body: warn });
	}
</script>

{#snippet warn()}
	<b>{row.name}</b> is signed out and can't sign in until you enable the account again. Nothing
	they created is deleted.
{/snippet}

<FormBoundary>
	{#each toggle.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
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
					await invalidate(['users']);
				})}
			>
				<input {...toggle.fields.id.as('hidden', row.id)} />
				{#if failed}<Status state="failed" />{/if}
				{#if row.timeDeleted}
					<Button type="submit" pending={!!toggle.pending}>
						<RotateCcw size={14} />
						Enable
					</Button>
				{:else}
					<IconButton
						type="submit"
						size="sm"
						label="Disable {row.name}"
						disabled={!!toggle.pending}
					>
						<UserX size={15} />
					</IconButton>
				{/if}
			</form>
		{/if}
	</div>
</FormBoundary>

<style>
	.acts,
	form {
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
</style>
