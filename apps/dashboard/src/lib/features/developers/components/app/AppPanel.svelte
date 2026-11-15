<script lang="ts">
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Empty, Issue, List, Section, Skeleton, Status, modal } from '@template/ui';
	import { ask } from '#lib/ask.ts';
	import { get, keys, remove } from '../../api/apps.query';
	import { list } from '../../api/webhooks.query';
	import KeyForm from '../key/KeyForm.svelte';
	import KeyList from '../key/KeyList.svelte';
	import WebhookForm from '../webhook/WebhookForm.svelte';
	import WebhookRow from '../webhook/WebhookRow.svelte';
	import Inbound from './Inbound.svelte';

	// What an admin configures on an App's profile, as sections of the people slice's page.
	let { id }: { id: string } = $props();

	const row = createQuery(() => get(id));
	const subs = createQuery(() => list(id));
	const owned = createQuery(() => keys(id));
	const drop = remove({ onSuccess: () => goto('/developers/apps') });

	const key = () => modal(KeyForm, { app: id });
	const hook = () => modal(WebhookForm, { owner: id });

	async function del(name: string) {
		const ok = await ask({
			title: 'Delete app',
			name,
			warn: "{name}'s keys, inbound secret and webhooks stop working immediately.",
			verify: true
		});
		if (ok) drop.mutate(id);
	}
</script>

{#snippet bearer()}
	Send as <code>Authorization: Bearer &lt;key&gt;</code>. Each key acts as the App.
{/snippet}

{#if row.isPending}
	<Skeleton h="12em" />
{:else if row.isError}
	<Issue retry={() => row.refetch()}>{row.error.message}</Issue>
{:else if !row.data}
	<Empty>That app doesn't exist, or was removed.</Empty>
{:else}
	{@const app = row.data}
	<Section divider title="API keys" description={bearer}>
		<div class="bar"><Button onclick={key}>New API key</Button></div>
		{#if owned.isPending}
			<List.Loading rows={2} boxed />
		{:else if owned.isError}
			<Issue retry={() => owned.refetch()}>{owned.error.message}</Issue>
		{:else}
			<KeyList keys={owned.data} app={id} />
		{/if}
	</Section>

	<Inbound {app} />

	<Section divider title="Webhooks" description="Events delivered to this app's endpoints.">
		<div class="bar"><Button onclick={hook}>New webhook</Button></div>
		{#if subs.isPending}
			<List.Loading rows={2} boxed />
		{:else if subs.isError}
			<Issue retry={() => subs.refetch()}>{subs.error.message}</Issue>
		{:else if subs.data.length === 0}
			<Empty>No webhooks for this app.</Empty>
		{:else}
			<List.Root label="Webhooks" boxed>
				{#each subs.data as one (one.id)}
					<WebhookRow row={one} />
				{/each}
			</List.Root>
		{/if}
	</Section>

	<Section
		danger
		divider
		title="Delete app"
		description="Its keys, inbound secret and webhooks stop working immediately."
	>
		<div class="bar start">
			<Button variant="danger" pending={drop.isPending} onclick={() => del(app.name)}>
				Delete app
			</Button>
			{#if drop.isError}<Status of={drop} />{/if}
		</div>
	</Section>
{/if}

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6em;
	}

	/* The danger button keeps its own width in the stretched column. */
	.start {
		justify-content: flex-start;
	}
</style>
