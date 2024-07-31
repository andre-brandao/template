<script lang="ts">
  import type { PageData } from './$types'
  import DnDBoard from '$components/dnd/DnDBoard.svelte'
  import { modal, FormModal } from '$modal'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import { invalidate } from '$app/navigation'

  export let data: PageData

  let columnsData = data.products.map(cat => ({
    id: cat.id,
    category: cat,
    items: cat.products,
  }))
  console.log(columnsData)

  async function handleBoardUpdated(newColumnsData: typeof columnsData) {
    console.log(newColumnsData)
    columnsData = newColumnsData
  }

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
            const resp = await trpc($page).product.insertProduct.mutate({
              name: data.name,
              description: data.description,
              category_id: category_id,
            })
            columnsData.map(col => {
              if (col.id === category_id) {
                col.items.push(resp)
              }
            })
            console.log(resp)
            window.location.reload()
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
            const resp = await trpc($page).product.insertProductCategory.mutate(
              {
                name: data.name,
              },
            )
            columnsData.push({
              id: resp.id,
              category: resp,
              items: [],
            })
            console.log(resp)
            window.location.reload()
          } catch (error) {
            return JSON.stringify(error)
          }
        },
        title: 'Add Category',
      },
    )
  }
</script>

<div class="mx-auto flex items-center justify-center ">
  <p>Produtos</p>
  <button class="btn btn-primary" onclick={handleAddCategory}>
    Add Category
  </button>
</div>

<DnDBoard
  columns={columnsData}
  onFinalUpdate={handleBoardUpdated}
  disabled={{
    card: false,
    column: false,
  }}
>
  {#snippet collum(cat)}
    <div class="flex items-center justify-center justify-between gap-4">
      <p>
        {cat.name}
      </p>
      <button
        class="btn btn-outline btn-primary"
        onclick={() => handleAddProduct(cat.id)}
      >
        +
      </button>
    </div>
  {/snippet}
  {#snippet card(p)}
    <a
      href="/admin/products/{p.id}"
      class="flex w-full flex-col gap-2 bg-base-300 text-center"
    >
      <p>{p.name}</p>
      <p>{p.description}</p>
    </a>
  {/snippet}
</DnDBoard>
