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
	/* The same box as `Input` and a closed `Combobox.Trigger` — the three sit side by side in
	   forms and read as one control family. The chevron is drawn, so it takes the theme. */
	select {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		min-height: var(--control);
		font: inherit;
		padding: 0.4em 2em 0.4em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background:
			linear-gradient(45deg, transparent 50%, var(--muted) 50%) calc(100% - 0.95em) 52% / 0.3em 0.3em no-repeat,
			linear-gradient(-45deg, transparent 50%, var(--muted) 50%) calc(100% - 0.75em) 52% / 0.3em 0.3em no-repeat,
			var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-1);
		appearance: none;
		cursor: pointer;
	}

	select:hover {
		border-color: var(--border-bright);
	}

	select:focus-visible {
		border-color: var(--accent);
		box-shadow: var(--ring);
		outline: none;
	}
</style>
