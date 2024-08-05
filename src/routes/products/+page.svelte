<script lang="ts">
  import type { PageData } from './$types'
  import Cardapio from '$lib/components/Cardapio.svelte'
  import Card1 from '$lib/components/cards/Card1.svelte'

  import { getImagePath } from '$utils/image'

  export let data: PageData
  const { products } = data
</script>

<Cardapio data={products}>
  {#snippet card(c)}
    <a href="/products/{c.id}">
      <Card1
        nome={c.name}
        descricao={c.description}
        image={getImagePath(c.image)}
        preco={'TODO'}
      />
    </a>
  {/snippet}
</Cardapio>
