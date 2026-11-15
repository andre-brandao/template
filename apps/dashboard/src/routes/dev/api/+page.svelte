<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import * as Header from '$lib/components/header';
	import { spec } from './api.query';

	const q = createQuery(spec);
</script>

<Header.Root title="API explorer">
	{#snippet lead()}
		The {q.data?.list.length ?? 0} operations <code>{q.data?.base}</code> serves, read from the live
		Hono routes. Requests run in-process with real auth: pick one of your <code>sk-</code> keys. Pick
		an operation from the list.
	{/snippet}
</Header.Root>
