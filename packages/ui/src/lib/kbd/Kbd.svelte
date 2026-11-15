<script lang="ts">
	import { getFormatForDisplay, type DisplayHotkey } from '@tanstack/svelte-hotkeys';

	let { keys }: { keys: DisplayHotkey } = $props();

	// Platform-aware: `Mod` reads ⌘ on a Mac and Ctrl elsewhere, from the provider's platform.
	const format = getFormatForDisplay();

	const steps = $derived(
		typeof keys === 'object' && 'length' in keys
			? format(keys, { parts: true })
			: [format(keys, { parts: true })]
	);
</script>

<!-- Nested kbd is the HTML way to spell a combo: the outer one is the whole input. -->
<kbd class="kbd" title={format(keys, { useSymbols: false })}>
	{#each steps as step, i (i)}
		{#if i > 0}<span class="then">then</span>{/if}
		{#each step as key, j (j)}
			<kbd class="key">{key}</kbd>
		{/each}
	{/each}
</kbd>

<style>
	.kbd {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;
		font: inherit;
		vertical-align: middle;
	}

	.key {
		display: inline-grid;
		place-items: center;
		min-width: 1.6em;
		height: 1.6em;
		padding: 0 0.35em;
		border: 1px solid var(--border, #e6e5e1);
		border-bottom-width: 2px;
		border-radius: 4px;
		background: var(--surface, #fff);
		color: var(--muted, #64625d);
		font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
		font-size: 0.72em;
		font-weight: 500;
		line-height: 1;
	}

	.then {
		color: var(--dim, #75736d);
		font-size: 0.72em;
	}
</style>
