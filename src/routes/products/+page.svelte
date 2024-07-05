<script lang="ts">
  import type { PageData } from './$types'
  import Cardapio from '$lib/components/Cardapio.svelte'
  import Card1 from '$lib/components/cards/Card1.svelte'

  export let data: PageData
  const { products } = data
</script>

<Cardapio data={products}>
  {#snippet card(c)}
    <a href="/products/{c.product.id}">
      <Card1
        nome={c.product.name}
        descricao={c.product.description}
        image="/api/image/{c.image_id}"
      />
    </a>
  {/snippet}
</Cardapio>
