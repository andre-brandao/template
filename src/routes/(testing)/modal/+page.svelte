<script lang="ts">
  import type { PageData } from './$types'
  export let data: PageData

  import DaisyModal from '$lib/components/Modal.svelte'

  import { modal } from '$lib/components/modal'
  import ExampleModal from '$components/modal/ExempleModal.svelte'
</script>

<button
  class="btn"
  onclick={() =>
    modal.open(ExampleModal, {
      props: {
        id: 1,
        name: 'John Doe',
        email: '',
      },
      props2: 'Hello world',
    })}
>
  OPEN
</button>

<button
  onclick={() =>
    modal.alert({
      text: 'This is an alert',
      onConfirm: () => {
        console.log('Confirmed')
      },
    })}
  class="btn"
>
  Alert
</button>
