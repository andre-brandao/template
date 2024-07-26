<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { Snippet } from 'svelte'

  interface ModalProps {
    onClose?: () => void
    onOpen?: () => void
    children: Snippet
    closeOnOutsideClick?: boolean
  }

  let {
    children,
    onClose = () => {},
    onOpen = () => {},
    closeOnOutsideClick = true,
  }: ModalProps = $props()

  let dialog: HTMLDialogElement

  onMount(() => {
    dialog.addEventListener('close', () => {
      onClose()
    })
    dialog.addEventListener('show', () => {
      onOpen()
    })
  })

  //   onDestroy(() => {
  //     dialog.removeEventListener('close', () => {})
  //     dialog.removeEventListener('show', () => {})
  //   })
</script>

<!-- Open the modal using ID.showModal() method -->
<button class="btn" onclick={() => dialog.showModal()}>open modal</button>
<dialog bind:this={dialog} id="my_modal_2" class="modal">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
        ✕
      </button>
    </form>
    {#if children}
      {@render children()}
    {:else}
      <div class="flex h-[200px] items-center justify-center">
        <span class="loading loading-spinner"></span>
      </div>
    {/if}
  </div>
  <form
    method="dialog"
    class:modal-backdrop={closeOnOutsideClick}
    class="modal-backdrop"
  >
    <button>close</button>
  </form>
</dialog>
