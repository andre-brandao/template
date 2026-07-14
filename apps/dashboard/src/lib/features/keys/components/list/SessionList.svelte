<script lang="ts">
	import type { Key } from '@template/core/key';
	import SessionCard from '../card/SessionCard.svelte';

	let { sessions }: { sessions: Key.Info[] } = $props();
</script>

{#if sessions.length === 0}
	<p class="empty">No active sessions.</p>
{:else}
	<ul>
		{#each sessions as session (session.id)}
			<SessionCard {session} />
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
