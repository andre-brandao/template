<script lang="ts">
	import { Button, Drawer } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { getKeys } from '../api/keys.remote';
	import KeyForm from '../components/form/KeyForm.svelte';
	import KeyList from '../components/list/KeyList.svelte';

	const keys = $derived(await getKeys());

	let creating = $state(false);
</script>

<Header.Root title="API keys">
	<Header.Item label="Keys">{keys.length}</Header.Item>
	<Header.Item label="Used">{keys.filter((one) => one.timeUsed).length}</Header.Item>
	{#snippet lead()}Send as <code>Authorization: Bearer &lt;key&gt;</code> to the API, CLI or MCP.{/snippet}
	{#snippet actions()}
		<Button onclick={() => (creating = true)}>New key</Button>
	{/snippet}
</Header.Root>

<Drawer bind:open={creating}>
	<h2>New key</h2>
	<KeyForm onsuccess={() => (creating = false)} />
</Drawer>

<KeyList {keys} />

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}
</style>
