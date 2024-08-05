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

<div class="bg-base-200 p-3 rounded-lg flex flex-col justify-center items-center">
  <h2 class="font-bold text-center text-xl">{item.name}</h2>
  <p class="text-center font-light">Quantidade Incluida: {item.quantity}</p>

  <div class="my-3">
    <ImageInput
      image_id={item.image}
      name={item.name}
      save={updateProductItemImage}
    />
  </div>
  <div class="flex flex-col justify-between gap-1 text-center">
    <p>WholeSale Price <span class="font-bold">{item.wholesale_price}</span></p>
    <p>Retail Price <span class="font-bold">{item.retail_price}</span></p>
  </div>
</div>
