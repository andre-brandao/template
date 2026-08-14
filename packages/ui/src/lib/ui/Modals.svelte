<script lang="ts">
	import Confirm from './Confirm.svelte';
	import Modal from './Modal.svelte';
	import { modal, slot } from './modal.svelte';
</script>

<!-- Mounted once, next to `Toaster`. The binding is one slot in both directions: the dialog
     opens whenever something is queued, and closing it — Escape, backdrop, a button —
     resolves the waiting caller. Modal only renders its body while open, so the confirm
     remounts per call and its typed-to-verify field starts empty every time. -->
<Modal bind:open={() => !!slot.current, (open) => open || modal.close()}>
	{#if slot.current?.kind === 'ask'}
		<Confirm opts={slot.current.opts} />
	{:else if slot.current}
		{@const Of = slot.current.of}
		<Of {...slot.current.props} close={modal.close} />
	{/if}
</Modal>
