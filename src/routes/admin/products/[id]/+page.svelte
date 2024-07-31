<script lang="ts">
  import type { PageData } from './$types'
  import { modal, FormModal } from '$modal'
  import type { InsertProductItem } from '$db/schema'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import ProductItem from './ProductItem.svelte'
  import ImageInput from '$lib/components/input/ImageInput.svelte'

  export let data: PageData

  const produto = data.prod
  function handleAddItem() {
    modal.open(FormModal<InsertProductItem>, {
      title: 'Add Product Item',
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
        },
        {
          name: 'quantity',
          label: 'Base Quantity',
          type: 'number',
          value: 1,
          required: true,
        },
        {
          name: 'wholesale_price',
          label: 'WholeSale Price',
          type: 'number',
          required: true,
        },
        {
          name: 'retail_price',
          label: 'Retail Price',
          type: 'number',
          required: true,
        },
      ],
      save: async data => {
        console.log(data)
        try {
          const [resp] = await trpc($page).product.insertProductItem.mutate({
            name: data.name,
            quantity: data.quantity,
            wholesale_price: data.wholesale_price,
            retail_price: data.retail_price,
            product_id: produto.id,
          })
          console.log(resp)
          produto.items.push({
            ...resp,
            updated_at: new Date(resp.updated_at ?? ''),
          })
        } catch (error) {
          console.error(error)
          return JSON.stringify(error, null, 2)
        }
      },
    })
  }
</script>

<main class="container mx-auto flex flex-col">
  <div
    class="card flex flex-row items-center justify-between bg-surface-300 p-2"
  >
    <ImageInput
      name={produto.name}
      image_id={produto.image}
      save={img => {
        trpc($page).product.updateProduct.mutate({
          id: produto.id,
          prod: { image: img },
        })
      }}
    />
    <div>
      <h2 class="title-font text-sm tracking-widest text-gray-500">
        {produto.category?.name}
      </h2>
      <h1 class="title-font mb-1 text-3xl font-medium text-gray-900">
        {produto.name}
      </h1>
      <p class="leading-relaxed">{produto.description}</p>
    </div>
    <button class="btn btn-primary" onclick={handleAddItem}>+ Add Item</button>
  </div>

  <div class="mt-3 flex flex-wrap gap-4">
    {#each produto.items as item}
      <ProductItem {item} />
    {/each}
  </div>
</main>
