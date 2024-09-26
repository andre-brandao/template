<script lang="ts">
  import type { PageData } from './$types'

  // export let data: PageData

  let { data }: { data: PageData } = $props()

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
  import TextFilter from '$components/table/filters/TextFilter.svelte'
  import { page } from '$app/stores'

  function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: number | undefined

    return (...args: Parameters<T>): void => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(() => func(...args), delay)
    }
  }

  const debounced_Filters_update = debounce(Filters_update, 550)

  let Filters = $derived($page.url)

  function Filters_get(name: string) {
    return Filters.searchParams.get(name)
  }

  function Filters_update({ name, value }: { name: string; value: string }) {
    if (name === undefined) return

    const url = new URL(Filters)

    if (!value) {
      url.searchParams.delete(name)
    }
    if (value !== '') url.searchParams.set(name, value)
    else url.searchParams.delete(name)
    console.log(url)

    const path_plus_params = url.pathname + url.search
    goto(path_plus_params, { keepFocus: true })
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

    const path_plus_params = url.pathname + url.search
    goto(path_plus_params, { keepFocus: true })
  }

  function Filters_clear(...params: string[]) {
    const url = new URL(Filters)
    params.forEach(p => url.searchParams.delete(p))

    const path_plus_params = url.pathname + url.search
    goto(path_plus_params, { keepFocus: true })
  }

  function Filters_isFiltered(...params: string[]) {
    return params.length > 0 && params.some(p => Filters.searchParams.has(p))
  }
  import SelectIndicator from '$components/table/edit/SelectIndicator.svelte'
  import EditableCell from '$components/table/edit/EditableCell.svelte'
  import { goto } from '$app/navigation'
  import type { SelectUser } from '$drizzle/schema'
  import { onDestroy, onMount } from 'svelte'

  const EditableCellLabel: DataLabel<SelectUser> = ({ column, row, value }) =>
    createRender(EditableCell, {
      row,
      column,
      value,
      onUpdateValue: (
        rowDataId: string,
        columnId: string,
        newValue: unknown,
      ) => {
        console.log(rowDataId, columnId, newValue)
        if (['age', 'visits', 'progress'].includes(columnId)) {
          // @ts-expect-error
          newValue = parseInt(newValue)
          // @ts-expect-error
          if (isNaN(newValue)) {
            // Refresh data to reset invalid values.
            $tableRows = $tableRows
            return
          }
        }
        if (columnId === 'status') {
          // @ts-expect-error
          if (!['relationship', 'single', 'complicated'].includes(newValue)) {
            // Refresh data to reset invalid values.
            $tableRows = $tableRows
            return
          }
        }
        // In this case, the dataId of each item is its index in $tableRows.
        // You can also handle any server-synchronization necessary here.
        const idx = parseInt(rowDataId)
        const currentItem = $tableRows[idx]
        const key = columnId // Cast as `keyof YourDataItem`
        const newItem = { ...currentItem, [key]: newValue }
        console.log(newItem)
        $tableRows[idx] = newItem
        $tableRows = $tableRows
        // Handle any server-synchronization.
      },
    })

  console.log(data)

  const tableRows = writable(data.rows ?? [])

  const table = createTable(tableRows, {
    sort: addSortBy({
      disableMultiSort: true,
      serverSide: true,
    }),
    // colOrder: addColumnOrder(),
    filter: addColumnFilters({
      // serverSide: true,
    }),
    select: addSelectedRows({}),
    resize: addResizedColumns(),
    page: addPagination({
      initialPageSize: 15,
      initialPageIndex: 1,
      serverItemCount: readable(data.count),
      serverSide: true,
    }),
    // grid: addGridLayout(),
  })

  type ItemTable = typeof table

  type Plugins = ItemTable['plugins']

  const columns = [
    table.display({
      id: 'selected',
      header: '',
      cell: ({ row, column }, { pluginStates }) => {
        const { isSomeSubRowsSelected, isSelected } =
          pluginStates.select.getRowState(row)
        return createRender(SelectIndicator, {
          isSelected,
          isSomeSubRowsSelected,
        })
      },
    }),
    table.column({
      header: 'ID',
      accessor: 'id',
      cell: EditableCellLabel,
    }),
    table.column({
      header: 'Name',
      accessor: 'username',
      cell: EditableCellLabel,
      plugins: {
        sort: {
          invert: false,
          // disable: true,
        },
        filter: {
          
          fn: ({ filterValue, value }) => {
            // return String(value)
            //   .toLowerCase()
            //   .startsWith(String(filterValue).toLowerCase())
            debounced_Filters_update({
              name: 'username',
              value: filterValue,
            })
            return true
          },
          initialFilterValue: '',
          render: ({ filterValue, values, preFilteredValues }) =>
            createRender(TextFilter, {
              filterValue,
              values,
              preFilteredValues,
            }),
        },
      },
    }),
    table.column({
      header: 'Email',
      accessor: 'email',
      cell: EditableCellLabel,

      plugins: {
        sort: {
          invert: false,
          // disable: true,
        },
        filter: {
          fn: ({ filterValue, value }) => {
            debounced_Filters_update({
              name: 'email',
              value: filterValue,
            })
            return true
          },
          initialFilterValue: '',
          render: ({ filterValue, values, preFilteredValues }) =>
            createRender(TextFilter, {
              filterValue,
              values,
              preFilteredValues,
            }),
        },
      },
    }),
    table.column({
      header: 'Verified',
      accessor: 'emailVerified',
      // cell: EditableCell
      cell: EditableCellLabel,
    }),
  ]

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

  const { columnWidths } = pluginStates.resize
  // $: console.log($columnWidths)

  const { pageIndex, pageCount, pageSize, hasNextPage, hasPreviousPage } =
    pluginStates.page
  // $: console.log(
  // 'page_index' + $pageIndex,
  // 'page_count' + $pageCount,
  // 'size' + $pageSize,
  // $hasNextPage,
  // $hasPreviousPage,
  // )

  // $effect(() => {
  //   console.log('data', data)
  //   console.log('rows', rows)
  //   tableRows.set(data.rows)
  // })

  $effect(() => {
    tableRows.set(data.rows)
    pageIndex.set(Number(Filters_get('page') ?? 1) - 1)

    const [sort] = $sortKeys
    console.log(sort)

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
  $inspect($sortKeys)
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
      <label for="pageSize">Page size</label>
      <input
        id="pageSize"
        type="number"
        class="w-3` input input-sm"
        min={1}
        max={100}
        onchange={e => {
          const value = (e.target as HTMLInputElement).value
          Filters_update({ name: 'pageSize', value: value })
        }}
      />
    </div>
    <div>
      <button
        class="btn"
        onclick={() => {
          Filters_update({ name: 'page', value: String($pageIndex) })
        }}
        disabled={!$hasPreviousPage}
      >
        Previous page
      </button>
      {$pageIndex + 1} out of {$pageCount}
      <button
        class="btn"
        onclick={() => {
          Filters_update({ name: 'page', value: String($pageIndex + 2) })
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
