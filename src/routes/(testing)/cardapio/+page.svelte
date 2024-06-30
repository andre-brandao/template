<script lang="ts">
  import type { PageData } from './$types'
  import Cardapio from '$lib/components/Cardapio.svelte'
  import Card1 from '$lib/components/cards/Card1.svelte'

  export let data: PageData
  const { products } = data
</script>

<!-- <pre>
  {JSON.stringify(data.products, null, 2)} 
</pre> -->

<Cardapio data={products}>
  {#snippet card(c)}
    <Card1
      nome={c.name}
      descricao={c.description}
      image="/image/{c.image_id}"
    />
  {/snippet}
</Cardapio>
