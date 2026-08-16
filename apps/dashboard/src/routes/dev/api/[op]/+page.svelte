<script lang="ts">
	import { Issue } from '@template/ui';
	import { page } from '$app/state';
	import { doc } from '../api.remote';
	import Console from '../Console.svelte';

	// `params` is briefly empty mid-navigation, so read it behind the guard.
	const id = $derived(page.params.op);
	const spec = $derived(await doc());
	const op = $derived(spec.list.find((one) => one.id === id));
</script>

{#if id}
	{#if op}
		{#key op.id}
			<Console {op} base={spec.base} />
		{/key}
	{:else}
		<Issue>No operation named <code>{id}</code>.</Issue>
	{/if}
{/if}
