<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { Button, Issue, Kbd, List, modal } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { list } from '../api/keys.query';
	import KeyForm from '../components/key/KeyForm.svelte';
	import KeyList from '../components/key/KeyList.svelte';

	const keys = createQuery(() => list());
	const create = () => modal(KeyForm);

	createHotkey('C', create);
</script>

<Header.Root title="API keys">
	{#if keys.data?.length}
		<Header.Item label="Keys">{keys.data.length}</Header.Item>
		<Header.Item label="Used">{keys.data.filter((one) => one.timeUsed).length}</Header.Item>
	{/if}
	{#snippet lead()}Keys that act as you. Send as <code>Authorization: Bearer &lt;key&gt;</code>.{/snippet}
	{#snippet actions()}
		<Button variant="primary" onclick={create}>New API key <Kbd keys="C" /></Button>
	{/snippet}
</Header.Root>

{#if keys.isPending}
	<List.Loading />
{:else if keys.isError}
	<Issue retry={() => keys.refetch()}>{keys.error.message}</Issue>
{:else}
	<KeyList keys={keys.data} />
{/if}
