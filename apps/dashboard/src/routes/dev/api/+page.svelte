<script lang="ts">
	import * as Header from '$lib/components/header';
	import { doc } from './api.remote';

	const spec = $derived(await doc());
</script>

<Header.Root title="API explorer">
	{#snippet lead()}
		The {spec.list.length} operations <code>{spec.base}</code> serves, read from the live Hono routes.
		Requests run in-process with real auth: pick one of your <code>sk-</code> keys. Pick an operation
		from the list.
	{/snippet}
</Header.Root>
