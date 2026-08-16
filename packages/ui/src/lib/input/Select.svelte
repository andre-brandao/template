<script module lang="ts">
	export type Option = { value: string; label: string; hint?: string };
</script>

<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let { options, ...rest }: { options: Option[] } & HTMLSelectAttributes = $props();
</script>

<select {...rest}>
	{#each options as option (option.value)}
		<option value={option.value}>{option.label}{option.hint ? ` — ${option.hint}` : ''}</option>
	{/each}
</select>

<style>
	/* The same box as a closed `Combobox.Trigger` — the two sit side by side in forms and
	   read as one control family. */
	select {
		width: 100%;
		min-width: 0;
		font: inherit;
		font-family: var(--font-mono, monospace);
		font-size: 0.8em;
		padding: 0.5em 0.6em;
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		background: var(--surface-2, #eee);
		color: var(--ink, #111);
		cursor: pointer;
	}

	select:hover {
		border-color: var(--border-bright, #555);
	}

	select:focus-visible {
		border-color: var(--accent, #4fa98f);
		outline: none;
	}
</style>
