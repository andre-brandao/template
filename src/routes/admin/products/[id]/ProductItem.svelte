<script lang="ts">
  import ImageInput from '$components/input/ImageInput.svelte'
  import CurrencyInput from '$components/input/CurrencyInput.svelte'

  import type { SelectProductItem } from '$drizzle/schema'

  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  import { toast } from 'svelte-sonner'
  import { icons } from '$lib/client/utils/icons'
  import { modal } from '$components/modal'
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
          price: item.price,
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

  async function handleDeleteProductItem() {
    try {
      await trpc($page).product.deleteProductItem.mutate(item.id)

      toast.success('Deletado com sucesso!')
      //TODO: Fix delete update sem recarregar
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message)
    }
  }
</script>

<div
  class="flex flex-col items-center justify-center space-y-1 rounded-lg bg-base-200 p-3"
>
  <!-- <h2 class="text-center text-xl font-bold">{item.name}</h2> -->

  <div class="flex items-center gap-2">
    <input
      type="text"
      class="input w-full"
      bind:value={item.name}
      on:change={() => (isChanged = true)}
    />

    <!-- <a class="btn" href="/admin/stock/{item.id}">
      {@html icons.box()}
    </a> -->
    <button class="btn btn-error" on:click={handleDeleteProductItem}>
      {@html icons.trash()}
    </button>
  </div>

  <div class="my-3">
    <ImageInput
      image_id={item.image}
      name={item.name}
      save={updateProductItemImage}
    />
  </div>
  <div class="flex w-full items-center justify-between gap-2">
    Price

    <CurrencyInput
      bind:value={item.price}
      on:change={() => (isChanged = true)}
    />
  </div>

  {#if isChanged}
    <button class="btn btn-outline mt-2" on:click={updateProductItemInfo}>
      Save Changes
    </button>
  {/if}
</div>
