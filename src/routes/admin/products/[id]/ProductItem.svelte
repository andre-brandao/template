<script lang="ts">
  import ImageInput from '$lib/components/input/ImageInput.svelte'

  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  export let item: {
    image: number | null
    id: number
    created_at: string | null
    name: string
    updated_at: Date | null
    product_id: number
    sku: string | null
    quantity: number
    retail_price: number
    wholesale_price: number
  }
</script>

<div class="bg-base-200 p-2">
  <h2 class="font-bold">{item.name}</h2>
  <p>Quantidade Incluida: {item.quantity}</p>

  <ImageInput
    image_id={item.image}
    name={item.name}
    save={image_id => {
      item.image = image_id
      trpc($page).product.updateProductItem.mutate({
        id: item.id,
        prod: {
          image: image_id,
        },
      })
    }}
  />
  <div class="flex justify-between gap-3">
    <p>WholeSale Price {item.wholesale_price}</p>
    <p>Retail Price {item.retail_price}</p>
  </div>
</div>
