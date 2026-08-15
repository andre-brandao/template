<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:boundary>
	{@render children()}

	{#snippet failed(error, reset)}
		<div class="crash">
			<p>Something went wrong.</p>
			<button type="button" onclick={reset}>Try again</button>
		</div>
	{/snippet}
</svelte:boundary>

<style>
	.crash {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin-bottom: 1em;
		padding: 0.6em 0.8em;
		border: 1px solid var(--danger, crimson);
		border-radius: var(--radius);
		color: var(--danger, crimson);
		font-size: 0.85em;
	}

	.crash button {
		border: 1px solid currentColor;
		border-radius: var(--radius);
		background: none;
		padding: 0.3em 0.7em;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
</style>
