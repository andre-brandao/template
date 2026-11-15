<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let { value = $bindable(), rows = 3, ...rest }: HTMLTextareaAttributes = $props();
</script>

<textarea bind:value {rows} style:--rows={rows} {...rest}></textarea>

<style>
	/* The same box as `Input`, growing with its text from `rows` up to a cap. */
	textarea {
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
		/* `field-sizing` ignores `rows`, so the floor is drawn from it here. */
		min-height: calc(var(--rows) * 1.5em + 0.8em + 2px);
		max-height: 24em;
		font: inherit;
		line-height: 1.5;
		padding: 0.4em 0.7em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius-sm, 6px);
		background: var(--surface, #fff);
		color: var(--ink, #1c1b19);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
		resize: vertical;
		field-sizing: content;
		transition:
			border-color 0.12s ease,
			box-shadow 0.12s ease;
	}

	textarea::placeholder {
		color: var(--dim, #75736d);
	}

	textarea:hover {
		border-color: var(--border-bright, #d3d1cc);
	}

	textarea:focus-visible {
		border-color: var(--accent, #2f7f68);
		outline: none;
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
	}
</style>
