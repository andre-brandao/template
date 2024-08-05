<script lang="ts">
  import ImageInput from '$lib/components/input/ImageInput.svelte'

  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  import { toast } from 'svelte-sonner'
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

  async function updateProductItemImage(image_id: number) {
    item.image = image_id

    try {
      const resp = await trpc($page).product.updateProductItem.mutate({
        id: item.id,
        prod: {
          image: image_id,
        },
      })
      console.log(resp)

      if (resp) {
        toast.success(`Product Item  Image#${item.id} updated`)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }
</script>

<div class="bg-base-200 p-2">
  <h2 class="font-bold">{item.name}</h2>
  <p>Quantidade Incluida: {item.quantity}</p>

  <ImageInput
    image_id={item.image}
    name={item.name}
    save={updateProductItemImage}
  />
  <div class="flex justify-between gap-3">
    <p>WholeSale Price {item.wholesale_price}</p>
    <p>Retail Price {item.retail_price}</p>
  </div>
</div>
