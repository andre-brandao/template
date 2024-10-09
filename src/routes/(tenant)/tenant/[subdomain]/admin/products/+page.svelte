<script lang="ts">
  import { toast } from 'svelte-sonner'
  import type { PageData } from './$types'
  import ImageInput from '$components/input/ImageInput.svelte'
  import { modal, FormModal } from '$modal'
  import { trpc } from '$lib/utils/trpc/client'
  import { page } from '$app/stores'
  import { invalidate } from '$app/navigation'
  import { icons } from '$lib/client/utils/icons'
  import { getImagePath } from '$lib/utils'

  export let data: PageData

  let products = data.products

  // async function handleDeleteProduct(id: number) {
  //   try {
  //     await trpc($page).product.deleteProduct.mutate(id)

  //     toast.success('Item deletado com sucesso!')
  //     columnsData = columnsData.map(col => {
  //       col.items = col.items.filter(item => item.id !== id)
  //       return col
  //     })
  //     //TODO: Fix delete update sem recarregar
  //     // window.location.reload()
  //   } catch (error: any) {
  //     toast.error(error.message)
  //   }
  // }

  function handleAddProduct(category_id: number) {
    console.log('add product')
    modal.open(
      FormModal<{
        name: string
        description: string
      }>,

      {
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'text',
            required: true,
          },
        ],
        save: async data => {
          console.log(data)
          try {
            const [resp] = await trpc($page).product.insertProduct.mutate({
              name: data.name,
              description: data.description,
              category_id: category_id,
            })
            // columnsData = columnsData.map(col => {
            //   if (col.id === category_id) {
            //     col.items.push(resp)
            //   }
            //   return col
            // })
            products = products.map(cat => {
              if (cat.id === category_id) {
                cat.products.push(resp)
              }
              return cat
            })
            console.log(resp)
            // window.location.reload()
          } catch (error) {
            return JSON.stringify(error)
          }
        },
        title: 'Add Product',
      },
    )
  }

  function handleAddCategory() {
    modal.open(
      FormModal<{
        name: string
      }>,
      {
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
          },
        ],
        save: async data => {
          console.log(data)
          try {
            const [resp] = await trpc(
              $page,
            ).product.insertProductCategory.mutate({
              name: data.name,
            })

            products = [
              {
                ...resp,
                products: [],
              },
              ...products,
            ]

            // columnsData = [
            //   {
            //     id: resp.id,
            //     category: {
            //       ...resp,
            //       products: [],
            //     },
            //     items: [],
            //   },
            //   ...columnsData,
            // ]

            console.log(resp)
            // window.location.reload()
          } catch (error: any) {
            console.error(error)
            return error.message
          }
        },
        title: 'Add Category',
      },
    )
  }
</script>

<div
  class="container sticky top-2 mx-auto flex items-center justify-between gap-3 rounded bg-base-200 p-2 z-30"
>
  <p class="text-5xl">Produtos</p>
  <button class="btn btn-primary" onclick={handleAddCategory}>
    Add Category
  </button>
</div>

<main class="container mx-auto mt-12">
  {#each products as category}
    <div>
      <div class="flex items-center justify-center gap-4">
        <p class="text-4xl">
          {category.name}
        </p>
        <button
          class="btn btn-outline btn-primary"
          onclick={() => handleAddProduct(category.id)}
        >
          +
        </button>
      </div>
      <div class="flex flex-col gap-3">
        {#each category.products as product}
          <div class="flex w-full gap-0 rounded-lg bg-base-300 text-center">
            <ImageInput
              name={product.name}
              image_id={product.image}
              save={async img => {
                product.image = img
                await trpc($page).product.updateProduct.mutate({
                  id: product.id,
                  prod: {
                    image: img,
                  },
                })
              }}
            />
            <a href="/admin/products/{product.id}" class="w-5/6 px-4 py-3">
              <p class="text-xl font-bold">{product.name}</p>
              <p
                class="font-light
                "
              >
                {product.description}
              </p>
            </a>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</main>
