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
  } from '$lib/components/table'

  import type { RouterOutputs, RouterInputs } from '$trpc/router'

  import { toast } from 'svelte-sonner'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'

  type Customer = RouterOutputs['customer']['paginatedUsers']['rows'][0]

  const defaultColumns: ColumnDef<Customer>[] = [
    {
      header: 'Name',
      accessorKey: 'name',

      footer: info => info.column.id,
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
    },
    {
      header:'Veri'
    }
 
  ]

  function load(s: TableState) {
    return trpc($page).customer.paginatedUsers.query(s)
  }
</script>

<div class=" h-[70vh] overflow-x-auto p-4">
  <Datatable columns={defaultColumns} {load} />
</div>
