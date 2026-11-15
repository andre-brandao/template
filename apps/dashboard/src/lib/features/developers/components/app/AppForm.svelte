<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Field, Input, Issue } from '@template/ui';
	import { create } from '../../api/apps.query';

	// Modal content. An App is its account's profile, so that page is where it is configured.
	let { close }: { close: () => void } = $props();

	let name = $state('');

	const save = create({
		onSuccess: (app) => {
			close();
			goto(`/u/${app.id}`);
		}
	});
</script>

<h2>New app</h2>

<form
	onsubmit={(e) => {
		e.preventDefault();
		save.mutate({ name });
	}}
>
	{#if save.error}
		<Issue>{save.error.message}</Issue>
	{/if}
	<Field label="Name">
		<Input
			placeholder="e.g. Billing, CI"
			required
			value={name}
			oninput={(e) => (name = e.currentTarget.value)}
		/>
	</Field>
	<p class="hint">A system account you own. Its keys act as it, never above your role.</p>
	<div class="actions">
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button variant="primary" type="submit" pending={save.isPending}>Create</Button>
	</div>
</form>

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.05em;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
	}

	.hint {
		margin: 0;
		font-size: 0.8em;
		color: var(--muted);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.4em;
	}
</style>
