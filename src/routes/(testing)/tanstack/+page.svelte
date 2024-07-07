<script lang="ts">
  import type { PageData } from './$types'

  import { toast } from 'svelte-sonner'
  export let data: PageData
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'

  import {
    renderComponent,
    type ColumnDef,
    type TableOptions,
  } from '@tanstack/svelte-table'
  import {
    type TableState,
    getParams,
    Datatable,
    EditRowButton,
    EditRowInput,
  } from '$lib/components/table'

  import type { RouterOutputs } from '$trpc/router'

  type Products = RouterOutputs['product']['paginatedProducts']['rows'][0]

  const defaultColumns: ColumnDef<Products>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: info =>
        renderComponent(EditRowInput<Products>, {
          id: info.row.original.id,
          colID: 'name',
          editT: 'text',
          value: info.getValue(),
        }),
      footer: info => info.column.id,
    },
    {
      // accessorFn: row => row.description,
      header: () => 'Description',
      accessorKey: 'description',
      cell: info =>
        renderComponent(EditRowInput<Products>, {
          id: info.row.original.id,
          colID: 'description',
          editT: 'text',
          value: info.getValue(),
        }),
      footer: info => info.column.id,
    },

    {
      id: 'edit',
      header: () => 'Edit',
      cell: info =>
        renderComponent(EditRowButton<Products>, {
          row: info.row.original,
        }),
      // footer: info => info.column.id,
    },
  ]

  async function load(s: TableState) {
    const resp = await trpc($page).product.paginatedProducts.query(s)

    return {
      data: resp.rows ?? [],
      count: resp.total ?? 0,
    }
  }

  async function save(changes: { [key: string]: Products }) {
    for (const key in changes) {
      try {
        const resp = await trpc($page).product.updateProduct.query({
          id: Number(key),
          prod: changes[key],
        })

        if (resp) {
          toast.success(`#${key} 'Product updated'`)
        }
      } catch (error) {
        toast.error(`#${key} 'Product update failed'`)
      }
    }
    return {
      success: true,
    }
  }
</script>

<div class="container mx-auto h-[70vh] overflow-x-auto border p-2">
  <Datatable columns={defaultColumns} {load} {save} />
</div>
