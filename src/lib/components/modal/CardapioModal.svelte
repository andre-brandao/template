<script lang="ts" generics="T">
  import { Modal } from '$lib/components/modal'
  import { modal } from '$lib/components/modal'
  import Cardapio from '$components/Cardapio.svelte'
  import { onMount } from 'svelte'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'

  export let data: {
    id: any
    name: string
    products: T[]
  }[]

  //   onMount(() => {
  //     data = trpc($page).product
  //   })
</script>

<Modal title="Produtos">
  <Cardapio {data}>
    {#snippet card(c)}
      <div></div>
    {/snippet}
  </Cardapio>
</Modal>
