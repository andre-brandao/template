<script lang="ts">
	import { Button, Drawer, Empty } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { getWebhooks } from '../api/admin.remote';
	import WebhookForm from '../components/WebhookForm.svelte';
	import WebhookRow from '../components/WebhookRow.svelte';

	const hooks = $derived(await getWebhooks());

	let creating = $state(false);
</script>

<Header.Root title="Webhooks">
	{#snippet lead()}POSTed by the queue worker, signed with <code>x-webhook-signature</code>.{/snippet}
	{#snippet actions()}
		<Button onclick={() => (creating = true)}>New webhook</Button>
	{/snippet}
	<Header.Item label="Registered">{hooks.length}</Header.Item>
	<Header.Item label="Enabled">{hooks.filter((hook) => hook.enabled).length}</Header.Item>
</Header.Root>

<Drawer bind:open={creating}>
	<h2>New webhook</h2>
	<WebhookForm onsuccess={() => (creating = false)} />
</Drawer>

{#if hooks.length === 0}
	<Empty>No webhooks yet.</Empty>
{:else}
	<ul>
		{#each hooks as row (row.id)}
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
