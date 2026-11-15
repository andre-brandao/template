<script lang="ts">
	import { Button, Issue } from '@template/ui';
	import { retire, revoke } from '../api/developers.query';

	let { id, app, label = 'Revoke' }: { id: string; app?: string; label?: string } = $props();

	// With `app` the key is the App's, revoked through its own route.
	const own = revoke();
	const its = retire();
	const drop = $derived(app ? its : own);

	const run = () =>
		app ? its.mutate({ path: { id: app, key: id } }) : own.mutate({ path: { id } });
</script>

{#if drop.error}
	<Issue>{drop.error.message}</Issue>
{/if}

<Button variant="danger" pending={drop.isPending} onclick={run}>{label}</Button>
