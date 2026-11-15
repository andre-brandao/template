<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { Button, Empty, Issue, Kbd, List, modal } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { list } from '../api/webhooks.query';
	import WebhookForm from '../components/webhook/WebhookForm.svelte';
	import WebhookRow from '../components/webhook/WebhookRow.svelte';

	const hooks = createQuery(() => list());
	const create = () => modal(WebhookForm);

	createHotkey('C', create);
</script>

<Header.Root title="Webhooks">
	{#snippet lead()}
		We POST each event to your endpoint, signed with <code>x-webhook-signature</code> so you can
		verify it.
	{/snippet}
	{#snippet actions()}
		<Button variant="primary" onclick={create}>New webhook <Kbd keys="C" /></Button>
	{/snippet}
	{#if hooks.data?.length}
		<Header.Item label="Registered">{hooks.data.length}</Header.Item>
		<Header.Item label="Enabled">{hooks.data.filter((one) => one.enabled).length}</Header.Item>
	{/if}
</Header.Root>

{#if hooks.isPending}
	<List.Loading />
{:else if hooks.isError}
	<Issue retry={() => hooks.refetch()}>{hooks.error.message}</Issue>
{:else if hooks.data.length === 0}
	<Empty>No webhooks yet. Press <Kbd keys="C" /> to add one.</Empty>
{:else}
	<List.Root label="Webhooks">
		{#each hooks.data as row (row.id)}
			<WebhookRow {row} />
		{/each}
	</List.Root>
{/if}
