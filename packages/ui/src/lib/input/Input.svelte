<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { ...rest }: HTMLInputAttributes = $props();
</script>

<input {...rest} />

<style>
	input {
		flex: 1;
		min-width: 0;
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
