<script module lang="ts">
	import type { Story } from '../story';
	import Dialog from './Dialog.svelte';

	export const story: Story = {
		title: 'Dialog',
		blurb:
			'The frame every `modal(Of)` body shares, so headings and footers match: `title`, an optional `error` as an Issue, the fields as children, then Cancel and the `submit` button with `pending`. Leave out `onsubmit` for an acknowledgment, which shows one "Done" that closes.',
		of: Dialog
	};
</script>

<script lang="ts">
	// import { Dialog, Field, Input } from '@template/ui';
	import Field from '../field/Field.svelte';
	import Input from '../input/Input.svelte';

	let name = $state('');
	let pending = $state(false);
	let error = $state<string>();

	function save() {
		pending = true;
		error = undefined;
		setTimeout(() => {
			pending = false;
			error = name ? undefined : 'A project needs a name';
		}, 600);
	}
</script>

<div class="stack">
	<div class="box">
		<Dialog title="New project" submit="Create project" {pending} {error} close={() => {}} onsubmit={save}>
			<Field label="Name"><Input bind:value={name} placeholder="Quarterly close" /></Field>
		</Dialog>
	</div>

	<div class="box">
		<Dialog title="New token" close={() => {}}>
			<p>Copy it now: it won't be shown again.</p>
		</Dialog>
	</div>
</div>

<style>
	.stack {
		display: grid;
		gap: 1.5em;
		max-width: 28em;
		margin: 1em;
	}

	.box {
		padding: 1.25em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	p {
		margin: 0;
	}
</style>
