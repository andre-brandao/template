<script lang="ts">
  import { Modal, modal } from '$components/modal'

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

  <div>
    {#if onConfirm}
      <button class="btn" onclick={confirm}>Confirm</button>
    {/if}
    <button class="btn" onclick={cancel}>
      {onCancel ? 'Cancel' : 'Close'}
    </button>
  </div>
</Modal>
