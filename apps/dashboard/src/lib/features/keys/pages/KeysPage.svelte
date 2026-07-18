<script lang="ts">
	import { Button, Drawer } from '@template/ui';
	import { getKeys } from '../api/keys.remote';
	import KeyForm from '../components/form/KeyForm.svelte';
	import KeyList from '../components/list/KeyList.svelte';

	const keys = $derived(await getKeys());

	let creating = $state(false);
</script>

<div class="head">
	<h1>API keys</h1>
	<Button onclick={() => (creating = true)}>New key</Button>
</div>

<p class="lead">
	Use a key as <code>Authorization: Bearer &lt;key&gt;</code> against the API, the CLI, or the MCP
	server. Set an expiry when you create one or leave it to never expire — revoke a key to cut it off.
</p>

<Drawer bind:open={creating}>
	<h2>New key</h2>
	<KeyForm onsuccess={() => (creating = false)} />
</Drawer>

<KeyList {keys} />

<style>
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75em;
		margin-bottom: 0.4em;
	}

	h1 {
		margin: 0;
		font-size: 1.4em;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	.lead {
		margin: 0 0 1.25em;
		color: var(--muted);
		max-width: 60ch;
	}

	.lead code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
</style>
