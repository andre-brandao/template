<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Empty } from '@template/ui';
	import KeyCard from '../card/KeyCard.svelte';

	let { keys, app }: { keys: Key.Info[]; app?: string } = $props();
</script>

{#if keys.length === 0}
	<Empty>No keys yet.</Empty>
{:else}
	<ul>
		{#each keys as key (key.id)}
			<KeyCard {key} {app} />
		{/each}
	</ul>
{/if}

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
