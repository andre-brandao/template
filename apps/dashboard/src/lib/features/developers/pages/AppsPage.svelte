<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { Button, Empty, Issue, Kbd, modal } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { apps } from '../api/apps.query';
	import AppForm from '../components/app/AppForm.svelte';
	import AppRow from '../components/app/AppRow.svelte';
	import List from '../components/List.svelte';
	import Loading from '../components/Loading.svelte';

	const list = createQuery(() => apps());
	const create = () => modal(AppForm);

	createHotkey('C', create);
</script>

<Header.Root title="Apps">
	{#snippet lead()}External systems with their own account, keys, webhooks and inbound endpoint.{/snippet}
	{#snippet actions()}
		<Button onclick={create}>New app <Kbd keys="C" /></Button>
	{/snippet}
	<Header.Item label="Registered">{list.data?.length ?? '–'}</Header.Item>
	<Header.Item label="Inbound">{list.data?.filter((one) => one.inbound).length ?? '–'}</Header.Item>
</Header.Root>

{#if list.isPending}
	<Loading />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.data.length === 0}
	<Empty>
		No apps yet.
		{#snippet action()}
			<Button onclick={create}>New app</Button>
		{/snippet}
	</Empty>
{:else}
	<List>
		{#each list.data as one (one.id)}
			<AppRow app={one} />
		{/each}
	</List>
{/if}
