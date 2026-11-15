<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Drawer, Empty, Issue, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { hooks } from '../api/developers.query';
	import WebhookForm from '../components/webhook/WebhookForm.svelte';
	import WebhookRow from '../components/webhook/WebhookRow.svelte';

	const list = createQuery(() => hooks());

	let creating = $state(false);
</script>

<Header.Root title="Webhooks">
	{#snippet lead()}POSTed by the queue worker, signed with <code>x-webhook-signature</code>.{/snippet}
	{#snippet actions()}
		<Button onclick={() => (creating = true)}>New webhook</Button>
	{/snippet}
	<Header.Item label="Registered">{list.data?.length ?? '–'}</Header.Item>
	<Header.Item label="Enabled">{list.data?.filter((hook) => hook.enabled).length ?? '–'}</Header.Item>
</Header.Root>

<Drawer bind:open={creating}>
	<h2>New webhook</h2>
	<WebhookForm onsuccess={() => (creating = false)} />
</Drawer>

{#if list.isPending}
	<Skeleton h="4em" />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.data.length === 0}
	<Empty>No webhooks yet.</Empty>
{:else}
	<ul>
		{#each list.data as row (row.id)}
			<WebhookRow {row} />
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
