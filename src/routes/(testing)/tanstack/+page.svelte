<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  import type { ColumnDef, TableOptions } from '@tanstack/svelte-table'
  import Datatable from '$lib/components/table/Datatable.svelte'
  import { getParams, type TableState } from '$lib/components/table'

  type Product = {
    id: number
    created_at: string | null
    name: string
    updated_at: Date | null
    description: string
  }

  async function myLoadFunction(state: TableState) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await fetch(`/datatable?${getParams(state)}`, {
        method: 'POST',
      }).then(res => res.json())
      const { total, rows } = response

      return {
        data: rows as Product[],
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

  const defaultColumns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      cell: info => info.getValue(),
      footer: info => info.column.id,
    },
    {
      accessorFn: row => row.description,
      id: 'description',
      cell: info => info.getValue(),
      header: () => 'Description',
      footer: info => info.column.id,
    },
  ]
</script>

<div class="container mx-auto h-[70vh] overflow-x-auto border p-2">
  <Datatable columns={defaultColumns} load={s => myLoadFunction(s)} />
</div>
