<script module lang="ts">
	import type { Story } from '../story';
	import Modal from './Modal.svelte';
	import Button from '../input/Button.svelte';

	export const story: Story = {
		title: 'Modal',
		blurb:
			'Centred `<dialog>`. Drive it with `bind:open`, or call `toggle()` / `openModal()` / `closeModal()` through `bind:this`.',
		of: Modal
	};
</script>

<script lang="ts">
	let open = $state(false);
	let handle = $state<ReturnType<typeof Modal>>();
</script>

<div class="row">
	<Button onclick={() => (open = true)}>Open with bind:open</Button>
	<Button variant="secondary" onclick={() => handle?.toggle()}>Toggle via instance</Button>
</div>

<Modal bind:open bind:this={handle}>
	<h3>Are you sure?</h3>
	<p>The backdrop and Escape both close it.</p>
	<Button variant="danger" onclick={() => handle?.closeModal()}>Close</Button>
</Modal>

<style>
	.row {
		display: flex;
		gap: 0.6em;
	}
</style>
