<script lang="ts" generics="Item">
  import {
    createTable,
    Subscribe,
    Render,
    createRender,
    type DataLabel,
    type Column,
    type Table,
  } from 'svelte-headless-table'
  import {
    addSortBy,
    addColumnOrder,
    addColumnFilters,
    addSelectedRows,
    addResizedColumns,
    addGridLayout,
    addPagination,
  } from 'svelte-headless-table/plugins'
  import {
    readable,
    writable,
    type Writable,
    type Readable,
  } from 'svelte/store'
  import TextFilter from './filters/TextFilter.svelte'

  import SelectIndicator from './edit/SelectIndicator.svelte'
  import EditableCell from './edit/EditableCell.svelte'
  import type { DrizzleDataTableCfg } from './types'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { toast } from 'svelte-sonner'
  export let cfg: DrizzleDataTableCfg

  async function loadData() {
    try {
      const resp = await trpc($page).drizzleTable.getData.query({
        table_name: cfg.name,
      })
      return resp
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
    }
  }

  let data: Writable<Item[]> = writable([])

  onMount(async () => {
    const items = await loadData()
    data.set(items)
  })
  const table = createTable(data, {
    sort: addSortBy({
      disableMultiSort: true,
    }),
    // colOrder: addColumnOrder(),
    filter: addColumnFilters(),
    select: addSelectedRows(),
    resize: addResizedColumns(),
    page: addPagination({
      initialPageSize: 15,
      initialPageIndex: 0,
      serverItemCount: readable(100),
      serverSide: true,
    }),
    // grid: addGridLayout(),
  })

  const columns = cfg.columns.map(column =>
    table.column({
      header: column.name,
      accessor: column.name,
    }),
  )

  type ItemTable = typeof table

  type Plugins = ItemTable['plugins']

  // export let createColumns: (table: ItemTable) => Column<Item, Plugins>[]

  // const columns = createColumns(table)

  const { headerRows, rows, tableAttrs, tableBodyAttrs, pluginStates } =
    table.createViewModel(columns)
</script>

<main class="container mx-auto overflow-x-auto">
  <table {...$tableAttrs} class=" table w-full">
    <thead>
      {#each $headerRows as headerRow (headerRow.id)}
        <Subscribe rowAttrs={headerRow.attrs()} let:rowAttrs>
          <!-- HeaderRow props -->
          <tr {...rowAttrs}>
            {#each headerRow.cells as cell (cell.id)}
              <Subscribe
                attrs={cell.attrs()}
                let:attrs
                props={cell.props()}
                let:props
              >
                <th {...attrs}>
                  <button on:click={props.sort.toggle}>
                    <Render of={cell.render()} />
                  </button>
                  {#if props.sort.order === 'asc'}
                    ⬇️
                  {:else if props.sort.order === 'desc'}
                    ⬆️
                  {/if}
                  {#if props.filter?.render}
                    <div>
                      <Render of={props.filter.render} />
                    </div>
                  {/if}

                  {#if !props.resize.disabled}
                    <div class="resizer" use:props.resize.drag></div>
                  {/if}
                </th>
              </Subscribe>
            {/each}
          </tr>
        </Subscribe>
      {/each}
    </thead>
    <tbody {...$tableBodyAttrs}>
      {#each $rows as row (row.id)}
        <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
          <tr {...rowAttrs}>
            {#each row.cells as cell (cell.id)}
              <Subscribe attrs={cell.attrs()} let:attrs>
                <td {...attrs}>
                  <Render of={cell.render()} />
                </td>
              </Subscribe>
            {/each}
          </tr>
        </Subscribe>
      {/each}
    </tbody>
  </table>

  <div class="flex items-center justify-between">
    <div>
      <label for="page-size">Page size</label>
      <input
        id="page-size"
        type="number"
        class="w-3` input input-sm"
        min={1}
        bind:value={$pageSize}
      />
    </div>
    <div>
      <button
        class="btn"
        on:click={() => $pageIndex--}
        disabled={!$hasPreviousPage}
      >
        Previous page
      </button>
      {$pageIndex + 1} out of {$pageCount}
      <button
        class="btn"
        on:click={() => $pageIndex++}
        disabled={!$hasNextPage}
      >
        Next page
      </button>
    </div>
  </div>
</main>

<style>
  table {
    border-spacing: 0;
    border-top: 1px solid black;
    border-left: 1px solid black;
  }
  th,
  td {
    border-bottom: 1px solid black;
    border-right: 1px solid black;
    padding: 0.5rem;
  }
  th {
    position: relative;
  }
  .resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -4px;
    width: 8px;
    background: lightgray;
    cursor: col-resize;
    z-index: 1;
  }
</style>
