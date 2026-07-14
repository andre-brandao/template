<script lang="ts">
	import { getKeys } from '../api/keys.remote';
	import KeyForm from '../components/form/KeyForm.svelte';
	import KeyList from '../components/list/KeyList.svelte';
	import SessionList from '../components/list/SessionList.svelte';

	const keys = $derived(await getKeys());
	const api = $derived(keys.filter((key) => key.type === 'api'));
	const sessions = $derived(keys.filter((key) => key.type === 'session'));
</script>

<h1>API keys</h1>

<p class="lead">
	Use a key as <code>Authorization: Bearer &lt;key&gt;</code> against the API, the CLI, or the MCP
	server. Keys do not expire — revoke one to cut it off.
</p>

<KeyForm />

<KeyList keys={api} />

<h2>Sessions</h2>

<p class="lead">
	Each login — browser or CLI — is its own token. Revoke one to sign that device out.
</p>

<SessionList {sessions} />

<style>
	h1 {
		margin: 0 0 0.4em;
		font-size: 1.4em;
	}

	h2 {
		margin: 2em 0 0.4em;
		font-size: 1.1em;
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
