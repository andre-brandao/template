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
		min-height: var(--control, 2.25em);
		font: inherit;
		padding: 0.4em 0.7em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		color: var(--ink, #1c1b19);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
		transition:
			border-color 0.12s ease,
			box-shadow 0.12s ease;
	}

	input::placeholder {
		color: var(--dim, #75736d);
	}

	input:hover {
		border-color: var(--border-bright, #d3d1cc);
	}

	input:focus-visible {
		border-color: var(--accent, #2f7f68);
		outline: none;
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
	}
</style>
