<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { Button, Empty, Issue, Kbd, List, modal } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { list } from '../api/apps.query';
	import AppForm from '../components/app/AppForm.svelte';
	import AppRow from '../components/app/AppRow.svelte';

	const apps = createQuery(() => list());
	const create = () => modal(AppForm);

	createHotkey('C', create);
</script>

<Header.Root
	title="Apps"
	lead="External systems with their own account, API keys, webhooks and inbound endpoint."
>
	{#snippet actions()}
		<Button variant="primary" onclick={create}>New app <Kbd keys="C" /></Button>
	{/snippet}
	{#if apps.data?.length}
		<Header.Item label="Registered">{apps.data.length}</Header.Item>
		<Header.Item label="Inbound">{apps.data.filter((one) => one.inbound).length}</Header.Item>
	{/if}
</Header.Root>

{#if apps.isPending}
	<List.Loading />
{:else if apps.isError}
	<Issue retry={() => apps.refetch()}>{apps.error.message}</Issue>
{:else if apps.data.length === 0}
	<Empty>No apps yet. Press <Kbd keys="C" /> to register one.</Empty>
{:else}
	<List.Root label="Apps">
		{#each apps.data as one (one.id)}
			<AppRow app={one} />
		{/each}
	</List.Root>
{/if}
