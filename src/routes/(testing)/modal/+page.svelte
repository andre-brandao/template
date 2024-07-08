<script lang="ts">
  import type { PageData } from './$types'
  export let data: PageData

  import { modal } from '$lib/components/modal'

  import { drawer } from '$lib/components/drawer'
  import ExempleDrawer from '$lib/components/drawer/ExempleDrawer.svelte'
</script>

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

<button
  class="btn"
  onclick={() => {
    drawer.open(ExempleDrawer, {
      title: 'Drawer',
    })
  }}
>
  Drawer
</button>
