<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData
  import {
    renderComponent,
    type ColumnDef,
    type TableOptions,
  } from '@tanstack/svelte-table'
  import Datatable from '$components/table/Datatable.svelte'

  import {
    type TableState,
    getParams,
    EditRowButton,
    EditRowInput,
    RowActions,
  } from '$lib/components/table'

  import type { RouterOutputs, RouterInputs } from '$trpc/router'

  import { toast } from 'svelte-sonner'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'

  type Customer = RouterOutputs['product']['paginatedProductItems']['rows'][0]

  const defaultColumns: ColumnDef<Customer>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Em estoque',
      accessorKey: 'quantity',
    },
    {
      header: 'Price',
      accessorKey: 'price',
    },
    {
      header: 'Actions',
      cell: info =>
        renderComponent(RowActions, {
          actions: [
            {
              name: 'View Details',
              fn: () => {
                goto(`/admin/stock/${info.row.original.id}`)
              },
            },
          ],
        }),
    },
  ]

  function load(s: TableState) {
    return trpc($page).product.paginatedProductItems.query(s)
  }
</script>

<div class=" h-[70vh] overflow-x-auto p-4">
  <Datatable columns={defaultColumns} {load} />
</div>
