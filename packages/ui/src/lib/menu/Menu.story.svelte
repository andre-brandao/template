<script module lang="ts">
	import type { Story } from '../story';
	import * as Menu from './index';
	import Root from './Menu.svelte';
	import IconButton from '../input/IconButton.svelte';

	export const story: Story = {
		title: 'Menu',
		blurb:
			'An action menu on top of Popover, holding its exclusive hotkey scope while open. Arrow keys, Home/End and type-ahead move between items, Enter runs one, and Escape or Tab closes it. An item\'s `shortcut` shows as Kbd and fires while the menu is open; bind it page-wide with `createHotkey` (as Edit is here) for when it is closed. Prefer Mod combos so a shortcut never fights type-ahead. `Menu.Item href` renders a real link, and `Menu.Label` a heading the arrows skip. Leave out `trigger` and call `at(e)` from `oncontextmenu` for a right-click menu.',
		of: Root
	};
</script>

<script lang="ts">
	// import { Menu } from '@template/ui';
	import { createHotkey } from '@tanstack/svelte-hotkeys';

	let last = $state('nothing yet');
	let context: Root | undefined = $state();

	// Page-wide twin of the item below; the menu's scope pauses this one while it is open.
	createHotkey('Mod+E', () => (last = 'edit (page)'));
</script>

<div class="row">
	<Menu.Root label="Issue actions">
		{#snippet trigger(attrs)}
			<IconButton label="Issue actions" {...attrs}>⋯</IconButton>
		{/snippet}
		<Menu.Label hint="ENG-142">Fix the login redirect</Menu.Label>
		<Menu.Separator />
		<Menu.Item shortcut="Mod+E" onselect={() => (last = 'edit')}>Edit</Menu.Item>
		<Menu.Item shortcut="Mod+D" onselect={() => (last = 'duplicate')}>Duplicate</Menu.Item>
		<Menu.Item onselect={() => (last = 'copy link')}>Copy link</Menu.Item>
		<Menu.Item href="#menu">Permalink</Menu.Item>
		<Menu.Item disabled>Move to project</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger shortcut="Mod+Backspace" onselect={() => (last = 'delete')}>Delete</Menu.Item>
	</Menu.Root>

	<span class="note">ran {last}</span>
</div>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="target" oncontextmenu={(e) => context?.at(e)}>Right-click anywhere in here</div>

<Menu.Root bind:this={context} label="Row actions">
	<Menu.Item onselect={() => (last = 'open')}>Open</Menu.Item>
	<Menu.Item onselect={() => (last = 'assign')}>Assign to me</Menu.Item>
	<Menu.Separator />
	<Menu.Item danger onselect={() => (last = 'archive')}>Archive</Menu.Item>
</Menu.Root>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin: 1em;
	}

	.target {
		display: grid;
		place-items: center;
		height: 8em;
		margin: 1em;
		border: 1px dashed var(--border-bright);
		border-radius: var(--radius);
		color: var(--dim);
		font-size: 0.88em;
	}

	.note {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
