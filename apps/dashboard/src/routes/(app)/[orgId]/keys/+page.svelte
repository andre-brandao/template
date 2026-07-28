<script lang="ts">
	import KeysPage from '$lib/features/keys/pages/KeysPage.svelte';
	import { getRoles } from '$lib/features/org/api/roles.remote';
	import { org } from '$lib/context/org';

	const ctx = org();
	// Fetched here — the keys slice can't reach into the org slice itself.
	const roles = $derived(ctx.can('member:read') ? await getRoles() : []);
</script>

<KeysPage {roles} />
