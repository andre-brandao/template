<script>
  import { getCartContext } from '$lib/client/stores/cart'
  import { getImagePath } from '$lib/client/utils/image'
  import { icons } from '$lib/client/utils/icons'

  const cart = getCartContext()

  $: subtotal = Object.values($cart).reduce(
    (acc, item) => acc + item.item.price * item.quantity,
    0,
  )

  import Drawer from '../modal/Drawer.svelte'

  let open = false
</script>

<button class="btn btn-circle btn-ghost" onclick={() => (open = true)}>
  <div class="indicator">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
    <span class="badge indicator-item badge-sm">
      {Object.keys($cart).length}
    </span>
  </div>
</button>

<Drawer {open} placement="bottom" clickAway={() => (open = false)} size="600px">
  <div class="flex flex-col items-center justify-center">
    <span class="text-lg font-bold">
      {Object.values($cart).length} Items
    </span>
    <div class="flex flex-col gap-3">
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
    </div>

    <span class="text-info">Subtotal: {(subtotal / 100).toFixed(2)}</span>

    {#if Object.keys($cart).length === 0}
      <p class="text-center">No items in cart</p>
    {:else}
      <a
        class="btn btn-outline"
        onclick={() => (open = false)}
        href="/checkout"
      >
        Checkout
      </a>
    {/if}
  </div>
</Drawer>
