<script module lang="ts">
	import type { Story } from '../story';
	import Command, { type Action } from './Command.svelte';
	import Button from '../input/Button.svelte';
	import Kbd from '../kbd/Kbd.svelte';

	export const story: Story = {
		title: 'Command',
		blurb:
			'The ⌘K palette shell: a modal dialog with a search box and grouped `commands` (`{ group, label, hint?, run }`). Every word you type has to match the group or label. Arrows, Home/End and Enter work from the input, and Escape or a backdrop click closes it. While open it holds an exclusive hotkey scope. It knows nothing about the app, so the caller binds the key with `createHotkey`; `preventDefault: "always"` keeps the browser from taking ⌘K while the scope pauses it.',
		of: Command
	};
</script>

<script lang="ts">
	// import { Command, Button, Kbd, type Action } from '@template/ui';
	import { createHotkey } from '@tanstack/svelte-hotkeys';

	let open = $state(false);
	let last = $state('nothing yet');

	const commands: Action[] = [
		{ group: 'Navigation', label: 'Go to projects', hint: 'G P', run: () => (last = 'projects') },
		{ group: 'Navigation', label: 'Go to inbox', hint: 'G I', run: () => (last = 'inbox') },
		{ group: 'Navigation', label: 'Go to settings', run: () => (last = 'settings') },
		{ group: 'Issue', label: 'Create issue', hint: 'C', run: () => (last = 'create') },
		{ group: 'Issue', label: 'Assign to me', hint: 'I', run: () => (last = 'assign') },
		{ group: 'Issue', label: 'Change status', hint: 'S', run: () => (last = 'status') },
		{ group: 'Theme', label: 'Switch to dark', run: () => (last = 'dark') },
		{ group: 'Theme', label: 'Switch to light', run: () => (last = 'light') }
	];

	createHotkey('Mod+K', () => (open = true), { preventDefault: 'always' });
</script>

<div class="row">
	<Button variant="secondary" onclick={() => (open = true)}>Open palette</Button>
	<span class="note">or press <Kbd keys="Mod+K" /> · ran {last}</span>
</div>

<Command bind:open {commands} />

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin: 1em;
	}

	.note {
		color: var(--dim);
		font-size: 0.85em;
	}
</style>
