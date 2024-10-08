<script lang="ts">
  import { getImagePath } from '$lib/utils/image'

  export let produto: {
    id: number
    created_at: string | null
    name: string
    description: string
    category_id: number
    updateAt: Date | null
    price: number
    image_id: number | null
    category: {
      id: number
      created_at: string | null
      name: string
    }
  }
</script>

<section class="body-font overflow-hidden">
  <div class="container mx-auto px-5 py-24">
    <div class="mx-auto flex flex-wrap-reverse lg:w-4/5">
      <div class="mb-6 w-full lg:mb-0 lg:w-1/2 lg:py-6 lg:pr-10">
        <h2 class="title-font text-sm tracking-widest">
          {produto.category.name}
        </h2>
        <h1 class="title-font mb-4 text-3xl font-medium">
          {produto.name}
        </h1>
        <div class="mb-4 flex">
          <a
            class="flex-grow border-b-2 border-indigo-500 px-1 py-2 text-lg text-indigo-500"
          >
            Description
          </a>
          <a class="flex-grow border-b-2 border-gray-300 px-1 py-2 text-lg">
            Reviews
          </a>
          <a class="flex-grow border-b-2 border-gray-300 px-1 py-2 text-lg">
            Details
          </a>
        </div>
        <p class="mb-4 leading-relaxed">
          {produto.description}
        </p>
        <div class="flex border-t border-gray-200 py-2">
          <span class="">Color</span>
          <span class="ml-auto">Blue</span>
        </div>
        <div class="flex border-t border-gray-200 py-2">
          <span class="">Size</span>
          <span class="ml-auto">Medium</span>
        </div>
        <div class="mb-6 flex border-b border-t border-gray-200 py-2">
          <span class="">Quantity</span>
          <span class="ml-auto">4</span>
        </div>
        <div class="flex">
          <span class="title-font text-2xl font-medium">
            ${produto.price.toFixed(2)}
          </span>
          <button class="btn btn-primary ml-auto flex">
            Adicionar Carrinho
          </button>
          <button
            class="ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-gray-200 p-0"
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
        </div>
      </div>
      <img
        alt="ecommerce"
        class="h-64 w-full rounded object-cover object-center lg:h-auto lg:w-1/2"
        src={getImagePath(produto.image_id)}
      />
    </div>
  </div>
</section>
