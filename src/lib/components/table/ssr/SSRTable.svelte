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
                  <button onclick={props.sort.toggle}>
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
      <label for="pageSize">Page size</label>
      <input
        id="pageSize"
        type="number"
        class="w-3` input input-sm"
        min={1}
        max={100}
        onchange={e => {
          const value = (e.target as HTMLInputElement).value
          SSRFilter.update({ name: 'pageSize', value: value })
        }}
      />
    </div>
    <div>
      <button
        class="btn"
        onclick={() => {
          Filters_update('page', $pageIndex.toString())
        }}
        disabled={!$hasPreviousPage}
      >
        Previous page
      </button>
      {$pageIndex + 1} out of {$pageCount}
      <button
        class="btn"
        onclick={() => {
          Filters_update('page', String($pageIndex + 2))
        }}
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
