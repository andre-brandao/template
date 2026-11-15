<script lang="ts">
	import { Dialog, Field, Input, Tabs, modal } from '@template/ui';
	import { mint } from '../../api/apps.query';
	import { create } from '../../api/keys.query';
	import Reveal from '../Reveal.svelte';

	// Modal content. `app` mints the key for that App instead of for the signed-in user.
	let { app, close }: { app?: string; close: () => void } = $props();

	let name = $state('');
	let ttl = $state('');
	const ttls = [
		{ value: '', label: 'Never' },
		{ value: '30', label: '30 days' },
		{ value: '90', label: '90 days' },
		{ value: '365', label: '1 year' }
	];

	// Opening the reveal replaces this modal, so the secret never outlives it.
	const done = (data: { key: string | null }) =>
		modal(Reveal, { title: 'New API key', secret: data.key ?? '' });
	const own = create({ onSuccess: done });
	const its = mint({ onSuccess: done });
	const save = $derived(app ? its : own);

	function submit() {
		const body = { name, expiresInDays: ttl ? Number(ttl) : undefined };
		if (app) return its.mutate({ app, ...body });
		own.mutate({ body });
	}
</script>

<Dialog
	title="New API key"
	submit="Create API key"
	pending={save.isPending}
	error={save.error?.message}
	{close}
	onsubmit={submit}
>
	<Field label="Name">
		<Input placeholder="e.g. laptop" required autofocus bind:value={name} />
	</Field>
	<Field label="Expires" as="div">
		<Tabs.Root aria-label="Expires">
			{#each ttls as one (one.value)}
				<Tabs.Item active={ttl === one.value} onclick={() => (ttl = one.value)}
					>{one.label}</Tabs.Item
				>
			{/each}
		</Tabs.Root>
	</Field>
</Dialog>
