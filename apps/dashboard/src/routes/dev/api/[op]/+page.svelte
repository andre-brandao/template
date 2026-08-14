<script lang="ts">
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
		<p class="error">No operation named <code>{id}</code>.</p>
	{/if}
{/if}
