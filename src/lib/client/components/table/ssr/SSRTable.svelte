<script module lang="ts">
  interface SSRTablePlugins<Item> extends AnyPlugins {
    sort: TablePlugin<
      Item,
      SortByState<Item>,
      SortByColumnOptions,
      SortByPropSet
    >
    filter: TablePlugin<
      Item,
      ColumnFiltersState<Item>,
      ColumnFiltersColumnOptions<Item>,
      ColumnFiltersPropSet
    >
    select: TablePlugin<
      Item,
      SelectedRowsState<Item>,
      Record<string, never>,
      SelectedRowsPropSet
    >
    //resize: TablePlugin<
    //  Item,
    //  ResizedColumnsState,
    //  ResizedColumnsColumnOptions,
    //  ResizedColumnsPropSet,
    //  ResizedColumnsAttributeSet
    //>
    page: TablePlugin<
      Item,
      PaginationState,
      Record<string, never>,
      NewTablePropSet<never>
    >
  }

  export interface SSRTableProps<Item> {
    tableRows: Writable<Item[]>
    count: Readable<number>
    columns: (
      table: Table<Item, SSRTablePlugins<Item>>,
    ) => Column<Item, SSRTablePlugins<Item>>[]
  }
</script>

<script lang="ts" generics="Item">
  import {
    createTable,
    Subscribe,
    Render,
    createRender,
    type DataLabel,
    type Column,
    type Table,
  } from '@andre-brandao/svelte-headless-table'
  import {
    addSortBy,
    addColumnOrder,
    addColumnFilters,
    addSelectedRows,
    addResizedColumns,
    addGridLayout,
    addPagination,
    type TablePlugin,
    type ColumnFiltersState,
    type ColumnFiltersColumnOptions,
    type ColumnFiltersPropSet,
    type SortByState,
    type SortByColumnOptions,
    type SortByPropSet,
    type SelectedRowsState,
    type SelectedRowsPropSet,
    type ResizedColumnsState,
    type ResizedColumnsColumnOptions,
    type ResizedColumnsPropSet,
    type ResizedColumnsAttributeSet,
    type PaginationState,
    type NewTablePropSet,
    type AnyPlugins,
  } from '@andre-brandao/svelte-headless-table/plugins'
  import {
    readable,
    writable,
    type Writable,
    type Readable,
  } from 'svelte/store'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { SSRFilter } from './index.svelte'

  let {
    tableRows,
    count,
    columns: createColumns,
  }: SSRTableProps<Item> = $props()

  const table = createTable(tableRows, {
    sort: addSortBy({
      disableMultiSort: true,
      serverSide: true,
    }),
    // colOrder: addColumnOrder(),
    filter: addColumnFilters({
      serverSide: true,
    }),
    select: addSelectedRows({}),
    page: addPagination({
      initialPageSize: 15,
      initialPageIndex: 1,
      serverItemCount: count,
      serverSide: true,
    }),
    // grid: addGridLayout(),
  })

  let Filters = $derived($page.url)

  function Filters_get(name: string) {
    return Filters.searchParams.get(name)
  }

  function Filters_update(name: string, value: string) {
    const url = new URL(Filters)
    if (value !== '') url.searchParams.set(name, value)
    else url.searchParams.delete(name)

    goto(url, { keepFocus: true })
  }
  function Filters_update_many(params: Record<string, string>) {
    const url = new URL(Filters)
    Object.entries(params).forEach(([name, value]) => {
      if (!value) {
        url.searchParams.delete(name)
      }
      if (value !== '') url.searchParams.set(name, value)
      else url.searchParams.delete(name)
    })

    const searchParams = url.pathname + url.search
    goto(searchParams, { keepFocus: true })
  }

  const columns = createColumns(table)

  const { headerRows, rows, tableAttrs, tableBodyAttrs, pluginStates } =
    table.createViewModel(columns)

  // const { columnIdOrder } = pluginStates.colOrder
  // $columnIdOrder = ['age', 'name']

  const { sortKeys } = pluginStates.sort
  // $: console.log($sortKeys)

  const { filterValues } = pluginStates.filter
  // $: console.log($filterValues)

  const { selectedDataIds } = pluginStates.select
  // $: console.log($selectedDataIds)

  //const { columnWidths } = pluginStates.resize
  // $: console.log($columnWidths)

  const { pageIndex, pageCount, pageSize, hasNextPage, hasPreviousPage } =
    pluginStates.page



  $effect(() => {
    pageIndex.set(Number($page.url.searchParams.get('page') ?? 1) - 1)

    const [sort] = $sortKeys

    if (!sort) {
      Filters_update_many({ sort_id: '', sort_order: '' })
    } else {
      Filters_update_many({ sort_id: sort.id, sort_order: sort.order })
    }
  })
  // $inspect($tableBodyAttrs)
  // $inspect($tableAttrs)
  // $inspect($headerRows)
  // $inspect($rows)
  $inspect($filterValues)
</script>

<section class="container px-4 mx-auto">
  <div class="flex flex-col mt-6">
    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden border border-base-300  md:rounded-lg">
              <table {...$tableAttrs} class="min-w-full divide-y divide-base-300">
                <thead class="bg-base-200 bg-opacity-60">
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
                            <th {...attrs} class="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-opacity-50 ">
                              <div class="flex gap-3 items-center">
                                <button onclick={props.sort.toggle}>
                                  <Render of={cell.render()} />
                                </button>
                                {#if props.sort.order === 'asc'}
                                  ⬇️
                                {:else if props.sort.order === 'desc'}
                                  ⬆️
                                {/if}
                                {#if props.filter?.render}
                                  
                                    <Render of={props.filter.render} />
                                  
                                {/if}
                              </div>
                            </th>
                          </Subscribe>
                        {/each}
                      </tr>
                    </Subscribe>
                  {/each}
                </thead>
                <tbody {...$tableBodyAttrs} class="bg-base divide-y divide-base-300">
                  {#each $rows as row (row.id)}
                    <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
                      <tr {...rowAttrs}>
                        {#each row.cells as cell (cell.id)}
                          <Subscribe attrs={cell.attrs()} let:attrs>
                            <td {...attrs} class="px-4 py-4 text-sm font-medium text-opacity-70 whitespace-nowrap">
                              <Render of={cell.render()} />
                            </td>
                          </Subscribe>
                        {/each}
                      </tr>
                    </Subscribe>
                  {/each}
                </tbody>
              </table>
            
              
              
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between mt-4">
        <div class="flex gap-2 items-center border border-base-300 rounded p-3">
          <label for="pageSize">Page size</label>
          <input
            id="pageSize"
            type="number"
            class="w-3` input input-sm"
            min={1}
            max={100}
            oninput={e => {
              const value = (e.target as HTMLInputElement).value
              Filters_update('pageSize',value )
            }}
          />
        </div>
        <div class="flex gap-5 items-center">
          <button
            class="btn btn-primary"
            onclick={() => {
              Filters_update('page', $pageIndex.toString())
            }}
            disabled={!$hasPreviousPage}
          >
            Previous page
          </button>
          {$pageIndex + 1} out of {$pageCount}
          <button
            class="btn btn-primary"
            onclick={() => {
              Filters_update('page', String($pageIndex + 2))
            }}
            disabled={!$hasNextPage}
          >
            Next page
          </button>
        </div>
      </div>
</section>
<main class="container mx-auto overflow-x-auto">
</main>

<style>
  /* table {
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
  } */
  /* .resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    right: -4px;
    width: 8px;
    background: lightgray;
    cursor: col-resize;
    z-index: 1;
  } */
</style>
