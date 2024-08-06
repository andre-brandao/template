<script lang="ts">
  import ImageInput from '$lib/components/input/ImageInput.svelte'
  import CurrencyInput from '$lib/components/input/CurrencyInput.svelte'

  import type { SelectProductItem } from '$db/schema'

  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  import { toast } from 'svelte-sonner'
  export let item: SelectProductItem

  let isChanged = false

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

  async function updateProductItemInfo() {
    try {
      const resp = await trpc($page).product.updateProductItem.mutate({
        id: item.id,
        prod: {
          name: item.name,
          quantity: item.quantity,
          wholesale_price: item.wholesale_price,
          retail_price: item.retail_price,
        },
      })
      console.log(resp)

      if (resp) {
        toast.success(`Product Item Info #${item.id} updated`)
      }
    } catch (error: any) {
      toast.error(error.message)
    }
    isChanged = false
  }

  function handleChange(e: Event) {
    isChanged = true
  }
</script>

<div
  class="flex flex-col items-center justify-center rounded-lg bg-base-200 p-3"
>
  <h2 class="text-center text-xl font-bold">{item.name}</h2>
  <div class=" flex w-full items-center justify-between font-light">
    <p>Quantidade Incluida:</p>

    <input
      type="number"
      class="input w-20"
      bind:value={item.quantity}
      on:change={() => (isChanged = true)}
    />
  </div>

  <div class="my-3">
    <ImageInput
      image_id={item.image}
      name={item.name}
      save={updateProductItemImage}
    />
  </div>
  <div class="flex flex-col justify-between gap-1 text-center">
    <p class="flex items-center justify-between gap-2">
      WholeSale Price

      <CurrencyInput
        bind:value={item.wholesale_price}
        on:change={handleChange}
      />
    </p>

    <p class="flex items-center justify-between gap-2">
      Retail Price <CurrencyInput
        bind:value={item.retail_price}
        on:change={handleChange}
      />
    </p>
  </div>

  {#if isChanged}
    <button class="btn btn-outline mt-2" on:click={updateProductItemInfo}>
      Save Changes
    </button>
  {/if}
</div>
