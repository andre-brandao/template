<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Field, Input, Issue } from '@template/ui';
	import { create } from '../../api/developers.query';

	let name = $state('');

	// An App is its account's profile: that page is where it is configured.
	const save = create({ onSuccess: (app) => goto(`/u/${app.id}`) });
</script>

<!-- Creating navigates to the new App, so there is no success state to show here. -->
{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

<form
	onsubmit={(e) => {
		e.preventDefault();
		save.mutate({ body: { name } });
	}}
>
	<Field label="Name">
		<Input
			placeholder="e.g. Billing, CI"
			required
			value={name}
			oninput={(e) => (name = e.currentTarget.value)}
		/>
	</Field>
	<p class="hint">
		Registers a system account you own. Its keys act as it, never above your role.
	</p>
	<Button type="submit" pending={save.isPending}>Create app</Button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
	}

	.hint {
		margin: 0;
		font-size: 0.8em;
		color: var(--muted);
	}
</style>
