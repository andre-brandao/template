<script lang="ts">
	import { Button, Drawer } from '@template/ui';
	import Header from '$lib/components/Header.svelte';
	import { getKeys } from '../api/keys.remote';
	import KeyForm from '../components/form/KeyForm.svelte';
	import KeyList from '../components/list/KeyList.svelte';

	const keys = $derived(await getKeys());

	let creating = $state(false);
</script>

<Header title="API keys">
	{#snippet actions()}
		<Button onclick={() => (creating = true)}>New key</Button>
	{/snippet}
	Use a key as <code>Authorization: Bearer &lt;key&gt;</code> against the API, the CLI, or the MCP
	server. Set an expiry when you create one or leave it to never expire — revoke a key to cut it off.
</Header>

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
