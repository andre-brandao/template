<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Drawer, Empty, Issue, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { apps } from '../api/developers.query';
	import AppCard from '../components/app/AppCard.svelte';
	import AppForm from '../components/app/AppForm.svelte';

	const list = createQuery(() => apps());

	let creating = $state(false);
</script>

<Header.Root title="Apps">
	{#snippet lead()}External systems with their own account, keys, webhooks and inbound endpoint.{/snippet}
	{#snippet actions()}
		<Button onclick={() => (creating = true)}>New app</Button>
	{/snippet}
	<Header.Item label="Registered">{list.data?.length ?? '–'}</Header.Item>
	<Header.Item label="Inbound">{list.data?.filter((app) => app.inbound).length ?? '–'}</Header.Item>
</Header.Root>

<Drawer bind:open={creating}>
	<h2>New app</h2>
	<AppForm />
</Drawer>

{#if list.isPending}
	<Skeleton h="4em" />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.data.length === 0}
	<Empty>No apps yet.</Empty>
{:else}
	<ul>
		{#each list.data as app (app.id)}
			<AppCard {app} />
		{/each}
	</ul>
{/if}

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}
</style>
