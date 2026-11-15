<script module lang="ts">
	import type { Story } from '../story';
	import Popover from './Popover.svelte';
	import Button from '../input/Button.svelte';
	import Input from '../input/Input.svelte';
	import Kbd from '../kbd/Kbd.svelte';

	export const story: Story = {
		title: 'Popover',
		blurb:
			'Native `popover="auto"` in the top layer: Escape, an outside click, or `close()` dismiss it, and focus goes back to the trigger. The `trigger` snippet gets attrs to spread on a button; the content snippet gets `close`. It opens on `side`, flips when there is no room, and focuses the first control inside. While open it holds an exclusive hotkey scope: page hotkeys pause (press S or L here, then try the other one with a popover open), and only hotkeys registered by components rendered inside it fire.',
		of: Popover
	};

	const statuses = ['Backlog', 'Todo', 'In progress', 'Done'];
</script>

<script lang="ts">
	// import { Popover, Button, Input, Kbd } from '@template/ui';
	import { createHotkey } from '@tanstack/svelte-hotkeys';

	let status = $state('Todo');
	let picking = $state(false);
	let open = $state(false);
	let link = $state('');

	// Page-level: suspended while either popover owns the keyboard.
	createHotkey('S', () => (picking = true));
	createHotkey('L', () => (open = true));
</script>

<div class="row">
	<Popover bind:open={picking} label="Status">
		{#snippet trigger(attrs)}
			<button class="chip" {...attrs}>{status}</button>
		{/snippet}
		{#snippet children(close)}
			{#each statuses as one (one)}
				<button
					class={['pick', { on: one === status }]}
					onclick={() => {
						status = one;
						close();
					}}>{one}</button
				>
			{/each}
		{/snippet}
	</Popover>

	<Popover bind:open side="bottom" align="end" label="Add link">
		{#snippet trigger(attrs)}
			<button class="chip" {...attrs}>+ Link</button>
		{/snippet}
		{#snippet children(close)}
			<form
				class="form"
				onsubmit={(e) => {
					e.preventDefault();
					close();
				}}
			>
				<Input
					placeholder="https://"
					value={link}
					oninput={(e) => (link = e.currentTarget.value)}
				/>
				<Button type="submit">Add</Button>
			</form>
		{/snippet}
	</Popover>

	<span class="note"
		><Kbd keys="S" /> status · <Kbd keys="L" /> link · link popover {open ? 'open' : 'closed'}{link
			? ` · ${link}`
			: ''}</span
	>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 1em;
	}

	.chip {
		padding: 0.25em 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: 0.85em;
		cursor: pointer;
	}

	.chip:hover {
		background: var(--hover);
	}

	.pick {
		display: block;
		width: 100%;
		padding: 0.35em 0.55em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 0.88em;
		text-align: left;
		cursor: pointer;
	}

	.pick:hover,
	.pick:focus-visible {
		background: var(--hover);
		outline: none;
	}

	.pick.on {
		box-shadow: inset 2px 0 0 var(--accent);
	}

	.form {
		display: flex;
		gap: 0.4em;
		padding: 0.2em;
		width: 18em;
	}

	.note {
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
