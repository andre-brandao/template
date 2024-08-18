<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  const { item_info } = data

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
  import { getImagePath } from '$lib/utils/image'

  type Transaction =
    RouterOutputs['product']['paginatedTransactions']['rows'][0]

  const defaultColumns: ColumnDef<Transaction>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
    },
    {
      header: 'Type',
      accessorKey: 'type',
    },
    {
      header: 'Quantity',
      accessorKey: 'quantity',
    },
    {
      header: 'Date',
      accessorFn: info => info.created_at?.toLocaleDateString(),
    },
  ]

  let transactions: Transaction[] = []
  async function load(s: TableState) {
    const resp = await trpc($page).product.paginatedTransactions.query({
      item_id: item_info.id,
      table_state: s,
    })

    transactions = resp.rows

    return resp
  }
</script>

<div class="stats shadow">
  <div class="stat">
    <div class="stat-figure text-secondary">
      <div class="avatar online">
        <div class="w-16 rounded-full">
          <img src={getImagePath(item_info.image)} alt="" />
        </div>
      </div>
    </div>
    <div class="stat-title"></div>
    <div class="stat-value text-primary">{item_info.name}</div>
    <div class="stat-desc">{item_info.description}</div>
  </div>

  <div class="stat">
    <div class="stat-figure text-secondary">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block h-8 w-8 stroke-current"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        ></path>
      </svg>
    </div>
    <div class="stat-title">Estoque</div>
    <div class="stat-value text-secondary">{item_info.quantity}</div>
    <div class="stat-desc">Quantidade atual em estoque</div>
  </div>

  <div class="stat">
    <!-- <div class="stat-figure text-secondary">
      <div class="avatar online">
        <div class="w-16 rounded-full">
          <img src={getImagePath(item_info.image)} alt="" />
        </div>
      </div>
    </div> -->
    <div class="stat-value">Preco</div>
    <div class="stat-title">R$ {(item_info.price / 100).toFixed(2)}</div>
    <div class="stat-desc text-secondary"></div>
  </div>
</div>

<div class=" h-[70vh] overflow-x-auto p-4">
  <Datatable columns={defaultColumns} {load} />
</div>
