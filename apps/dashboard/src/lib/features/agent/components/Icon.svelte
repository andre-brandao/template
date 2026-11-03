<!-- A bare icon button for the drawer's bar and composer. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { children, ...rest }: HTMLButtonAttributes & { children: Snippet } = $props();
</script>

<button type="button" {...rest}>{@render children()}</button>

<style>
	button {
		display: inline-grid;
		place-items: center;
		padding: 0.4em;
		border: none;
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	button:hover:not(:disabled),
	button[aria-pressed='true'] {
		background: var(--surface-2);
		color: var(--ink);
	}

	button:disabled {
		color: var(--dim);
		cursor: default;
	}
</style>
