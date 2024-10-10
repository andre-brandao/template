<script lang="ts">
  import { getCartContext } from '$lib/client/stores/cart'
  import { getImagePath, icons } from '$lib/utils'
  import type { PageData } from './$types'

  import { toast } from 'svelte-sonner'
  import { trpc } from '$lib/utils/trpc/client'
  import { page } from '$app/stores'

  export let data: PageData

  const cart = getCartContext()

  $: subtotal = Object.values($cart).reduce(
    (acc, item) => acc + item.item.price * item.quantity,
    0,
  )

  $: items_quantity = Object.values($cart).reduce(
    (acc, item) => acc + item.quantity,
    0,
  )

  function makeOrder() {
    const items = Object.values($cart).map(item => ({
      id: item.item.id,
      quantity: item.quantity,
    }))

    trpc($page).customer
  }
</script>

<main class="container mx-auto flex flex-col items-center justify-center">
  <div>
    <h1>Order</h1>
    <p>Items in cart: {Object.values($cart).length}</p>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    tabindex="0"
    class="card dropdown-content card-compact z-[1] mt-3 w-72 bg-base-100 shadow"
  >
    <div class="card-body">
      <span class="text-lg font-bold">
        {items_quantity} Items
      </span>
      <!-- TODO: format price -->
      <span class="text-info">Subtotal: {(subtotal / 100).toFixed(2)}</span>
      <div class="card-actions">
        {#each Object.values($cart) as item}
          <div class="flex items-center justify-between gap-2">
            <img
              src={getImagePath(item.item.image)}
              alt={item.item.name}
              class="h-10 w-10 rounded-lg"
            />

            <div class="flex w-full justify-between p-1">
              <div class="font-bold">{item.quantity} x</div>
              <div>{item.item.name}</div>
            </div>

            <button
              class="btn btn-error"
              onclick={() => cart.removeItem(item.item.id)}
            >
              {@html icons.trash()}
            </button>
          </div>
        {/each}
        {#if Object.keys($cart).length === 0}
          <p class="text-center">No items in cart</p>
          <a class="btn btn-outline" href="/products">See the catalog</a>
        {:else}
          <button class="btn btn-outline w-full">Fazer Pedido</button>
        {/if}
      </div>
    </div>
  </div>
</main>
