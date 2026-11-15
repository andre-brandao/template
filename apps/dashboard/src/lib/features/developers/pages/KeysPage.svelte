<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Button, Drawer, Issue, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { keys } from '../api/developers.query';
	import KeyForm from '../components/form/KeyForm.svelte';
	import KeyList from '../components/list/KeyList.svelte';

	const list = createQuery(() => keys());

	let creating = $state(false);
</script>

<Header.Root title="Personal access tokens">
	<Header.Item label="Tokens">{list.data?.length ?? '–'}</Header.Item>
	<Header.Item label="Used">{list.data?.filter((one) => one.timeUsed).length ?? '–'}</Header.Item>
	{#snippet lead()}Tokens that act as you. Send as <code>Authorization: Bearer &lt;key&gt;</code> to the API, CLI or MCP.{/snippet}
	{#snippet actions()}
		<Button onclick={() => (creating = true)}>New token</Button>
	{/snippet}
</Header.Root>

<Drawer bind:open={creating}>
	<h2>New token</h2>
	<KeyForm onsuccess={() => (creating = false)} />
</Drawer>

{#if list.isPending}
	<Skeleton h="4em" />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else}
	<KeyList keys={list.data} />
{/if}

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}
</style>
