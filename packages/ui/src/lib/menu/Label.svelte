<script lang="ts">
	import type { Snippet } from 'svelte';

	// A heading inside the menu, like the signed-in account; arrows skip it.
	let { hint, children }: { hint?: string; children: Snippet } = $props();
</script>

<div class="label" role="presentation">
	<span class="text">{@render children()}</span>
	{#if hint}<span class="hint">{hint}</span>{/if}
</div>

<style>
	.label {
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		padding: 0.45em 0.55em 0.5em;
		font-size: 0.88em;
	}

	.text {
		color: var(--ink);
		font-weight: 600;
	}

	.hint {
		overflow: hidden;
		color: var(--dim);
		font-size: 0.92em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
