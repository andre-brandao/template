<script lang="ts">
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import Kbd from '../kbd/Kbd.svelte';

	// Rendered inside a Popover, so these land in its exclusive scope and pause with it.
	let { today, clear }: { today: () => void; clear?: () => void } = $props();

	createHotkey('T', () => today());
	// Skipped while a text field has focus, so typing still deletes.
	createHotkey(
		'Backspace',
		() => clear?.(),
		() => ({ enabled: !!clear })
	);
</script>

<footer class="keys">
	<span><Kbd keys="T" /> Today</span>
	{#if clear}<span><Kbd keys="Backspace" /> Clear</span>{/if}
	<span><Kbd keys="Escape" /> Close</span>
</footer>

<style>
	.keys {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9em;
		padding: 0.45em 0.5em 0.2em;
		border-top: 1px solid var(--border, #e6e5e1);
		color: var(--dim, #8e8c86);
		font-size: 0.78em;
	}

	span {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}
</style>
