<script lang="ts">
	import { Issue } from '@template/ui';
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { spec } from '../api.query';
	import Console from '../Console.svelte';

	// `params` is briefly empty mid-navigation, so read it behind the guard.
	const id = $derived(page.params.op);
	const q = createQuery(spec);
	const op = $derived(q.data?.list.find((one) => one.id === id));
</script>

{#if id && q.data}
	{#if op}
		{#key op.id}
			<Console {op} base={q.data.base} />
		{/key}
	{:else}
		<Issue>No operation named <code>{id}</code>.</Issue>
	{/if}
{/if}
