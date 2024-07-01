<script lang="ts">
  import type { PageData } from './$types'
  export let data: PageData

  import DaisyModal from '$lib/components/Modal.svelte'

  import { modal } from '$lib/components/modal'
  import ExampleModal from './ExempleModal.svelte'
</script>

<DaisyModal>
  <div>Ola mundo</div>
</DaisyModal>

<button
  on:click={() =>
    modal.open(ExampleModal, {
      props: {
        id: 1,
        name: 'John Doe',
        email: '',
      },
    })}
>
  OPEN
</button>
