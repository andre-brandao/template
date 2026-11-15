<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { Button, Issue, Kbd, modal } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { keys } from '../api/keys.query';
	import KeyForm from '../components/key/KeyForm.svelte';
	import KeyList from '../components/key/KeyList.svelte';
	import Loading from '../components/Loading.svelte';

	const list = createQuery(() => keys());
	const create = () => modal(KeyForm);

	createHotkey('C', create);
</script>

<Header.Root title="Personal access tokens">
	<Header.Item label="Tokens">{list.data?.length ?? '–'}</Header.Item>
	<Header.Item label="Used">{list.data?.filter((one) => one.timeUsed).length ?? '–'}</Header.Item>
	{#snippet lead()}Tokens that act as you. Send as <code>Authorization: Bearer &lt;key&gt;</code>.{/snippet}
	{#snippet actions()}
		<Button onclick={create}>New token <Kbd keys="C" /></Button>
	{/snippet}
</Header.Root>

{#if list.isPending}
	<Loading />
{:else if list.isError}
	<Issue>{list.error.message}</Issue>
{:else}
	<KeyList keys={list.data} {create} />
{/if}
