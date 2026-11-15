<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { value = $bindable(), ...rest }: HTMLInputAttributes = $props();
</script>

<input bind:value {...rest} />

<style>
	input {
		flex: 1;
		min-width: 0;
		box-sizing: border-box;
		min-height: var(--control);
		font: inherit;
		padding: 0.4em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-1);
		transition:
			border-color 0.12s ease,
			box-shadow 0.12s ease;
	}

	input::placeholder {
		color: var(--dim);
	}

	input:hover {
		border-color: var(--border-bright);
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
		box-shadow: var(--ring);
	}
</style>
