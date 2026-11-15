<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { Button, Empty, Issue, Kbd, modal } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { hooks } from '../api/webhooks.query';
	import List from '../components/List.svelte';
	import Loading from '../components/Loading.svelte';
	import WebhookForm from '../components/webhook/WebhookForm.svelte';
	import WebhookRow from '../components/webhook/WebhookRow.svelte';

	const list = createQuery(() => hooks());
	const create = () => modal(WebhookForm);

	createHotkey('C', create);
</script>

<Header.Root title="Webhooks">
	{#snippet lead()}POSTed by the queue worker, signed with <code>x-webhook-signature</code>.{/snippet}
	{#snippet actions()}
		<Button onclick={create}>New webhook <Kbd keys="C" /></Button>
	{/snippet}
	<Header.Item label="Registered">{list.data?.length ?? '–'}</Header.Item>
	<Header.Item label="Enabled">{list.data?.filter((one) => one.enabled).length ?? '–'}</Header.Item>
</Header.Root>

{#if list.isPending}
	<Loading />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.data.length === 0}
	<Empty>
		No webhooks yet.
		{#snippet action()}
			<Button onclick={create}>New webhook</Button>
		{/snippet}
	</Empty>
{:else}
	<List>
		{#each list.data as row (row.id)}
			<WebhookRow {row} />
		{/each}
	</List>
{/if}
