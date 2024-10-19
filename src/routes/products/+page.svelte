<script lang="ts">
  import type { PageData } from './$types'
  import Cardapio from '$components/Cardapio.svelte'
  import Card1 from '$components/cards/Card1.svelte'


  export let data: PageData
  const { products } = data
</script>

<Cardapio data={products}>
  {#snippet card(c)}
    <a href="/products/{c.id}">
      <Card1
        nome={c.name}
        descricao={c.description}
        image={c.image}
        preco={'TODO'}
      />
    </a>
  {/snippet}
</Cardapio>
