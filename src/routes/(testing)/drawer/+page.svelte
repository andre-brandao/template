<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  import Drawer from '$modal/Drawer.svelte'
  let open = false
</script>

<button class="btn" on:click={() => (open = true)}>Open</button>

<Drawer
  {open}
  placement="left"
  clickAway={() => (open = false)}
  size="600px"
  animated
>
  <div class="flex flex-col items-center justify-center">
    <span class="text-lg font-bold">Drawer</span>
    <p>Click away to close</p>
  </div>
</Drawer>
