<script lang="ts">
  import type { PageData } from './$types'
  import { modal, FormModal } from '$modal'
  import type { InsertProductItem } from '$db/schema'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import ProductItem from './ProductItem.svelte'
  import ImageInput from '$lib/components/input/ImageInput.svelte'

  import { toast } from 'svelte-sonner'

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

  async function updateProductImage(image_id: number) {
    try {
      const [resp] = await trpc($page).product.updateProduct.mutate({
        id: produto.id,
        prod: { image: image_id },
      })
      if (resp) {
        toast.info(`Product Image #${produto.id} updated`)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }
</script>

<main class="container mx-auto flex flex-col">
  <div
    class="card flex flex-row items-center justify-between bg-surface-200 p-2"
  >
    <ImageInput
      name={produto.name}
      image_id={produto.image}
      save={updateProductImage}
    />
    <div>
      <h2 class="title-font text-md tracking-widest text-gray-600 text-center">
        {produto.category?.name}
      </h2>
      <h1 class="mb-1 text-3xl font-bold text-gray-900 text-center">
        {produto.name}
      </h1>
      <p class="leading-relaxed font-light text-sm text-center">Descricão: {produto.description}</p>
    </div>
    <button class="btn btn-primary px-5" onclick={handleAddItem}>+ Add Item</button>
  </div>

  <div class="mt-3 flex flex-wrap gap-4">
    {#each produto.items as item, i (item.id)}
      <ProductItem {item} />
    {/each}
  </div>
</main>
