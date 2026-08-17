<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue, toast } from '@template/ui';
	import { password } from '../api/profile.remote';

	let { set }: { set: boolean } = $props();

	let el = $state<HTMLFormElement>();
	const issues = $derived(password.fields.allIssues() ?? []);
</script>

<FormBoundary>
	{#each issues as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	<form
		bind:this={el}
		{...password.enhance(async (f) => {
			await f.submit();
			el?.reset();
			toast.success(set ? 'Password changed' : 'Password set');
		})}
	>
		<Field label={set ? 'New password' : 'Password'} style="max-width: 24em">
			<div class="row">
				<Input
					{...password.fields._password.as('password', '')}
					autocomplete="new-password"
					placeholder="At least 8 characters"
				/>
				<Button type="submit" pending={!!password.pending}>{set ? 'Change' : 'Set'}</Button>
			</div>
		</Field>
	</form>
</FormBoundary>

<style>
	.row {
		display: flex;
		gap: 0.6em;
	}
</style>
