<script lang="ts">
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import Button from '../input/Button.svelte';
	import Kbd from '../kbd/Kbd.svelte';

	// Rendered inside a Popover, so these land in its exclusive scope and pause with it.
	let { today, clear, close }: { today: () => void; clear?: () => void; close: () => void } =
		$props();

	createHotkey('T', () => today());
	// Skipped while a text field has focus, so typing still deletes.
	createHotkey(
		'Backspace',
		() => clear?.(),
		() => ({ enabled: !!clear })
	);
</script>

<footer class="keys">
	<div class="quick">
		<Button variant="ghost" onclick={today}>Today <Kbd keys="T" /></Button>
		{#if clear}<Button variant="ghost" onclick={clear}>Clear <Kbd keys="Backspace" /></Button>{/if}
	</div>
	<Button variant="ghost" onclick={close}>Close <Kbd keys="Escape" /></Button>
</footer>

<style>
	.keys {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		padding: 0.4em 0.2em 0.1em;
		border-top: 1px solid var(--border);
		font-size: 0.78em;
	}

	.quick {
		display: flex;
		gap: 0.15em;
	}

	@media (max-width: 30em) {
		.keys {
			position: sticky;
			bottom: 0;
			padding: 0.55em 0.15em 0.1em;
			background: var(--surface);
			font-size: 0.88em;
		}

		.keys :global(kbd) {
			display: none;
		}
	}
</style>
