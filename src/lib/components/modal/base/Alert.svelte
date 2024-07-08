<script lang="ts">
  import { Modal, modal } from '$lib/components/modal'

  interface Props {
    title?: string
    text: string
    onConfirm?: () => void
    onCancel?: () => void
  }

  const { title = 'Alert!!!!', text, onCancel, onConfirm }: Props = $props()

  function confirm() {
    modal.close()
    onConfirm?.()
  }

  function cancel() {
    modal.close()
    onCancel?.()
  }
</script>

<Modal {title}>
  <p>{text}</p>
  <svelte:fragment slot="footer">
    {#if onConfirm}
      <button class="btn" onclick={confirm}>Confirm</button>
    {/if}
    <button class="btn" onclick={cancel}>
      {onCancel ? 'Cancel' : 'Close'}
    </button>
  </svelte:fragment>
</Modal>
