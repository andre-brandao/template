<script module lang="ts">
	import type { Story } from '../story';
	import Kbd from './Kbd.svelte';

	export const story: Story = {
		title: 'Kbd',
		blurb:
			'Hotkey labels through TanStack Hotkeys `getFormatForDisplay()`: `Mod` reads ⌘ on a Mac and Ctrl elsewhere, and an array is a sequence. Bind keys with `createHotkey` / `createHotkeyAttachment` from `@tanstack/svelte-hotkeys` directly. Its default `ignoreInputs: "auto"` skips single keys and Shift/Alt combos while typing in inputs, textareas and contenteditable; Mod combos and Escape still fire.',
		of: Kbd,
		props: { keys: { type: 'text', value: 'Mod+Shift+P' } }
	};
</script>

<script lang="ts">
	// import { Kbd } from '@template/ui';
	import { createHotkey } from '@tanstack/svelte-hotkeys';

	let hits = $state<string[]>([]);

	const log = (what: string) => (hits = [what, ...hits].slice(0, 4));

	createHotkey(['G', 'P'], () => log('g then p'));
	createHotkey('Shift+/', () => log('?'));
	createHotkey('Mod+J', () => log('mod+j'));
</script>

<ul class="list">
	<li><Kbd keys="Mod+K" /> palette</li>
	<li><Kbd keys="Shift+Enter" /> newline</li>
	<li><Kbd keys="Alt+ArrowUp" /> move up</li>
	<li><Kbd keys="Escape" /> close</li>
	<li><Kbd keys={['G', 'P']} /> go to projects</li>
</ul>

<p class="note">
	Try <Kbd keys={['G', 'P']} />, <Kbd keys="Shift+/" /> or <Kbd keys="Mod+J" />, then type in the
	box: only <Kbd keys="Mod+J" /> gets through, because the library ignores plain keys in inputs by
	default.
</p>
<input class="box" placeholder="typing here is ignored" />
<div class="box" contenteditable="true" role="textbox" tabindex="0" aria-label="Editable">
	so is this contenteditable
</div>
<p class="note">{hits.length ? hits.join(' · ') : 'no hits yet'}</p>

<style>
	.list {
		display: grid;
		gap: 0.5em;
		margin: 1em;
		padding: 0;
		list-style: none;
		font-size: 0.88em;
		color: var(--muted);
	}

	.note {
		margin: 1em;
		color: var(--dim);
		font-size: 0.85em;
	}

	.box {
		display: block;
		margin: 0.4em 1em;
		padding: 0.35em 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: 0.88em;
		width: 18em;
	}
</style>
