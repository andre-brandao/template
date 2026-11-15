<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { ...rest }: HTMLInputAttributes = $props();
</script>

<input {...rest} />

<style>
	input {
		flex: 1;
		min-width: 0;
		min-height: 2.25em;
		font: inherit;
		padding: 0.4em 0.7em;
		border: 1px solid var(--border, #ddd);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		color: var(--ink, #111);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.05));
		transition:
			border-color 0.12s ease,
			box-shadow 0.12s ease;
	}

	input::placeholder {
		color: var(--dim, #999);
	}

	input:hover {
		border-color: var(--border-bright, #ccc);
	}

	input:focus-visible {
		border-color: var(--accent, #2f7f68);
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent);
	}
</style>
