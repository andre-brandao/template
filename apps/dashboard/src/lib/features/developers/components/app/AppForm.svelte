<script lang="ts">
	import { goto } from '$app/navigation';
	import { Dialog, Field, Input } from '@template/ui';
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

<Dialog
	title="New app"
	submit="Create app"
	pending={save.isPending}
	error={save.error?.message}
	{close}
	onsubmit={() => save.mutate({ name })}
>
	<Field label="Name">
		<Input placeholder="e.g. Billing, CI" required autofocus bind:value={name} />
	</Field>
	<p>A system account you own. Its keys act as it, never above your role.</p>
</Dialog>

<style>
	p {
		margin: 0;
		font-size: 0.8em;
		color: var(--muted);
	}
</style>
