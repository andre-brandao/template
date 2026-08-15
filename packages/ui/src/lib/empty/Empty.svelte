<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		action,
		children
	}: {
		/** The way out of the empty state — a button or a link. */
		action?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="empty" class:offers={!!action}>
	<p>{@render children()}</p>
	{@render action?.()}
</div>

<style>
	.empty {
		color: var(--dim, #888);
		font-size: 0.9em;
	}

	p {
		margin: 0;
	}

	/* With somewhere to go it becomes a place on the page rather than a note in the
	   flow, so it takes the room to say so. */
	.offers {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9em;
		padding: 2.5em 1em;
		text-align: center;
	}
</style>
