<script lang="ts">
  import type { PageData } from './$types'

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

  import type { RouterInputs, RouterOutputs } from '$trpc/router'

  type Products = RouterOutputs['product']['paginatedProducts']['rows'][0]

  async function myLoadFunction(state: TableState) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await fetch(`/datatable?${getParams(state)}`, {
        method: 'POST',
      }).then(res => res.json())
      const { total, rows } = response

      return {
        data: rows as Products[],
        count: total,
      }
    } catch (error) {
      console.error(error)
      return {
        data: [],
        count: 0,
      }
    }
  }

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
</script>

<div class="container mx-auto h-[70vh] overflow-x-auto border p-2">
  <Datatable
    columns={defaultColumns}
    load={async s => {
      const resp = await trpc($page).product.paginatedProducts.query(s)
      return {
        data: resp.rows ?? [],
        count: resp.total ?? 0,
      }
    }}
    save={console.warn}
  />
</div>
