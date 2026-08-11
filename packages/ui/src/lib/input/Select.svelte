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
	select {
		min-width: 0;
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		background: var(--surface, #fff);
		color: var(--ink, #111);
	}

	select:focus-visible {
		border-color: var(--accent, #4fa98f);
		outline: none;
	}
</style>
