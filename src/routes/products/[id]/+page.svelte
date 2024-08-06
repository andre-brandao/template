<script lang="ts">
  import { getImagePath } from '$lib/utils/image'
  import type { PageData } from './$types'
  import { icons } from '$lib/utils/icons'
  import Detail from '$components/detail/Detail1.svelte'
  import { tweened } from 'svelte/motion'

  import { getCartContext } from '$lib/stores/cart'
  const cart = getCartContext()
  console.log(cart)

  export let data: PageData
  const { produto } = data

  let quantity = 1
  function increment() {
    quantity += 1
  }
  function decrement() {
    if (quantity === 1) return
    quantity -= 1
  }

  let activeItemIndex = 0

  let total = tweened(
    (produto.items[activeItemIndex].retail_price ?? 0) * quantity,
    {
      duration: 300,
    },
  )
  $: $total = (produto.items[activeItemIndex].retail_price ?? 0) * quantity

  function addToCart() {
    console.log(cart)

    cart.addItem({
      item: produto.items[activeItemIndex],
      quantity: quantity ?? 1,
    })
    quantity = 1
  }
</script>

<section class="body-font overflow-hidden">
  <div class="container mx-auto px-5 py-24">
    <div class="mx-auto flex flex-wrap-reverse justify-between gap-3 lg:w-4/5">
      <div class="mb-6 w-full lg:mb-0 lg:w-1/2 lg:py-6 lg:pr-10">
        <button onclick={() => history.back()} class="btn btn-primary mb-3">
          {@html icons.arrows.left_line()} Back
        </button>
        <h2 class="title-font text-sm tracking-widest">
          {produto.category?.name}
        </h2>
        <h1 class="title-font mt-1 text-3xl font-bold">
          {produto.name}
        </h1>
        <!-- <div class="mb-4 flex">
          <button
            class="flex-grow border-b-2 border-indigo-500 px-1 py-2 text-lg text-indigo-500"
          >
            Description
          </button>
          <button class="flex-grow border-b-2 border-gray-300 px-1 py-2 text-lg">
            Reviews
          </button>
          <button class="flex-grow border-b-2 border-gray-300 px-1 py-2 text-lg">
            Details
          </button>
        </div> -->
        <p class="mb-4 leading-relaxed">
          Description: {produto.description}
        </p>

        <div class="flex gap-3 border-t border-gray-200 py-2">
          {#each produto.items as variant, i (variant)}
            <!-- TODO: improve minicard -->
            <button
              class="btn {activeItemIndex === i ? 'btn-primary' : ''}"
              value={i}
              onclick={() => (activeItemIndex = i)}
            >
              {variant.name}
            </button>
          {/each}
        </div>

        <div
          class="mb-6 flex items-center border-b border-t border-gray-200 py-2"
        >
          <span class="">Quantity</span>
          <span class="ml-auto">
            <button class="btn btn-primary" onclick={decrement}>-</button>
            <span class="mx-2">{quantity}</span>
            <button class="btn btn-primary" onclick={increment}>+</button>
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="title-font text-2xl font-bold">
            ${$total.toFixed(2)}
          </span>
          <div class="flex items-center gap-4">
            <button
              class="inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-gray-200 p-0"
            >
              <svg
                fill="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                class="h-5 w-5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                ></path>
              </svg>
            </button>
            <button class="btn btn-primary flex" onclick={addToCart}>
              Add to cart
            </button>
          </div>
        </div>
      </div>
      <img
        alt="ecommerce"
        class="h-64 w-full rounded object-cover object-center lg:h-auto lg:w-1/3"
        src={getImagePath(
          produto.items[activeItemIndex].image ?? produto.image,
        )}
      />
    </div>
  </div>
</section>
