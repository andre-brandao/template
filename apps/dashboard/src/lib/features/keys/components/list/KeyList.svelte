<script lang="ts">
	import type { Key } from '@template/core/key';
	import KeyCard from '../card/KeyCard.svelte';

	let { keys }: { keys: Key.Info[] } = $props();
</script>

{#if keys.length === 0}
	<p class="empty">No keys yet.</p>
{:else}
	<ul>
		{#each keys as key (key.id)}
			<KeyCard {key} />
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

	.empty {
		color: var(--dim);
	}
</style>
