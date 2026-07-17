<script lang="ts">
	import { getKeys } from '../api/keys.remote';
	import KeyForm from '../components/form/KeyForm.svelte';
	import KeyList from '../components/list/KeyList.svelte';

	const keys = $derived(await getKeys());
</script>

<h1>API keys</h1>

<p class="lead">
	Use a key as <code>Authorization: Bearer &lt;key&gt;</code> against the API, the CLI, or the MCP
	server. Set an expiry when you create one or leave it to never expire — revoke a key to cut it off.
</p>

<KeyForm />

<KeyList {keys} />

<style>
	h1 {
		margin: 0 0 0.4em;
		font-size: 1.4em;
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
