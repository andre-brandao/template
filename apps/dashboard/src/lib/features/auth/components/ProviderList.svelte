<script lang="ts">
	import type { User } from '@template/core/user';
	import ProviderRow from './ProviderRow.svelte';

	let { providers }: { providers: User.Provider[] } = $props();
</script>

<ul>
	{#each providers as provider (provider.id)}
		<ProviderRow {provider} />
	{/each}
</ul>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}
</style>
