<script module lang="ts">
	export type Option = { value: string; label: string; hint?: string };
</script>

<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let { options, value = $bindable(), ...rest }: { options: Option[] } & HTMLSelectAttributes = $props();
</script>

<select bind:value {...rest}>
	{#each options as option (option.value)}
		<option value={option.value}>{option.label}{option.hint ? ` — ${option.hint}` : ''}</option>
	{/each}
</select>

<style>
	/* The same box as `Input` and a closed `Combobox` — the three sit side by side in
	   forms and read as one control family. The chevron is drawn, so it takes the theme. */
	select {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		min-height: var(--control, 2.25em);
		font: inherit;
		padding: 0.4em 2em 0.4em 0.7em;
		border: 1px solid var(--border, #e6e5e1);
		border-radius: var(--radius-sm, 6px);
		background:
			linear-gradient(45deg, transparent 50%, var(--muted, #64625d) 50%) calc(100% - 0.95em) 52% / 0.3em 0.3em no-repeat,
			linear-gradient(-45deg, transparent 50%, var(--muted, #64625d) 50%) calc(100% - 0.75em) 52% / 0.3em 0.3em no-repeat,
			var(--surface, #fff);
		color: var(--ink, #1c1b19);
		box-shadow: var(--shadow-1, 0 1px 2px rgb(0 0 0 / 0.04));
		appearance: none;
		cursor: pointer;
	}

	select:hover {
		border-color: var(--border-bright, #d3d1cc);
	}

	select:focus-visible {
		border-color: var(--accent, #2f7f68);
		box-shadow: var(--ring, 0 0 0 3px color-mix(in oklab, var(--accent, #2f7f68) 16%, transparent));
		outline: none;
	}
</style>
