<script lang="ts">
	import { Button, Drawer, Empty } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import { getWebhooks } from '../api/admin.remote';
	import WebhookForm from '../components/WebhookForm.svelte';
	import WebhookRow from '../components/WebhookRow.svelte';

	const hooks = $derived(await getWebhooks());

	let creating = $state(false);
</script>

<Header title="Webhooks">
	{#snippet actions()}
		<Button onclick={() => (creating = true)}>New webhook</Button>
	{/snippet}
	Published events are POSTed from the queue worker, so nothing here slows a request down.
	Each delivery carries an <code>x-webhook-signature</code> — an HMAC-SHA256 of the body and
	the <code>x-webhook-timestamp</code>, keyed on this endpoint's secret. A failing endpoint is
	retried on its own and disables itself after 20 consecutive failures.
</Header>

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
