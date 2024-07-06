<script lang="ts" generics="T">
  import { writable } from 'svelte/store'
  import Loading from '../Loading.svelte'
  import {
    createTable,
    FlexRender,
    getCoreRowModel,
  } from '@tanstack/svelte-table'
  import type { ColumnDef, TableOptions } from '@tanstack/svelte-table'

  // import { type TableState } from '.'

  interface DatatableProps {
    columns: ColumnDef<T>[]
    load: (state: TableState) => Promise<
      | {
          data: T[]
          count: number
        }
      | undefined
    >
  }

  type TableState = {
    currentPage: number
    rowsPerPage: number
    search: string | undefined
    sort?: {
      field: string
      direction: 'asc' | 'desc' | string
    }

    filters?: Record<string, string>

    totalRows: number

    isLoading?: boolean
  }

  let { columns, load }: DatatableProps = $props()

  let datatableState = $state<TableState>({
    
    currentPage: 1,
    rowsPerPage: 20,
    search: undefined,
    totalRows: 0,
  })
  let maxPages = $derived(
    Math.ceil(datatableState.totalRows / datatableState.rowsPerPage),
  )

  async function invalidate(state: TableState) {
    datatableState.isLoading = true
    console.log(true)

    const resp = await load(state)
    console.log(resp)

    if (resp) {
      options.data = resp.data ?? []
      datatableState.totalRows = resp.count ?? 0
    }
    console.log(false)

    datatableState.isLoading = false
  }

  let timer: NodeJS.Timeout

  function setSearch(newSearch: string | undefined) {
    // depounce input
    clearTimeout(timer)
    timer = setTimeout(async () => {
      datatableState.currentPage = 1
      datatableState.search = newSearch
      invalidate(datatableState)
    }, 250)
  }
  const setFilter = (col: string, newFilter: string) => {
    datatableState.currentPage = 1
    if (!datatableState.filters) {
      datatableState.filters = {}
    }
    datatableState.filters[col] = newFilter
    invalidate(datatableState)
  }

  const setPagination = (page: number) => {
    datatableState.currentPage = page
    invalidate(datatableState)
  }

  const setSort = (field: string, direction: 'asc' | 'desc' | string) => {
    datatableState.sort = {
      field,
      direction,
    }
    invalidate(datatableState)
  }

  function getSortIcon(direction: 'asc' | 'desc' | string) {
    return direction == 'asc' ? '^' : 'v'
  }

  const options = $state<TableOptions<T>>({
    data: [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const table = $state(createTable(options))
  invalidate(datatableState)

  let rowsPerPageOptions = [10, 20, 50, 100]
</script>

<section>
  <header>
    <div class="mb-2">
      <input
        bind:value={datatableState.search}
        oninput={() => setSearch(datatableState.search)}
        type="search"
        class="input input-sm input-bordered"
        placeholder="Search ..."
      />
    </div>
  </header>
  <article class="thin-scrollbar">
    {#if datatableState.isLoading}
      <Loading />
    {:else}
      <table class="table table-pin-cols table-xs">
        <thead>
          {#each table.getHeaderGroups() as headerGroup}
            <tr>
              {#each headerGroup.headers as header}
                <th colspan={header.colSpan}>
                  {#if !header.isPlaceholder}
                    <button
                      disabled={!header.column.getCanSort()}
                      onclick={header.column.getToggleSortingHandler()}
                    >
                      <FlexRender
                        content={header.column.columnDef.header}
                        context={header.getContext()}
                      />

                      <span>
                        {getSortIcon(header.column.getIsSorted().toString())}
                      </span>
                    </button>
                  {/if}
                </th>
              {/each}
            </tr>
          {/each}
        </thead>
        <tbody>
          {#each table.getRowModel().rows as row}
            <tr>
              {#each row.getVisibleCells() as cell}
                <td>
                  <FlexRender
                    content={cell.column.columnDef.cell}
                    context={cell.getContext()}
                  />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
        <tfoot>
          {#each table.getFooterGroups() as footerGroup}
            <tr>
              {#each footerGroup.headers as header}
                <th>
                  {#if !header.isPlaceholder}
                    <FlexRender
                      content={header.column.columnDef.footer}
                      context={header.getContext()}
                    />
                  {/if}
                </th>
              {/each}
            </tr>
          {/each}
        </tfoot>
      </table>
    {/if}
  </article>
  <footer class="mt-2 flex justify-between">
    <div class="flex items-center">
      Showing
      <div class="dropdown dropdown-top">
        <div tabindex="0" role="button" class="btn m-1">
          {datatableState.rowsPerPage}
        </div>
        <ul
          tabindex="0"
          class="menu dropdown-content z-[1] rounded-box bg-base-300 p-2 shadow"
        >
          {#each rowsPerPageOptions as opt}
            <li>
              <button
                class=""
                onclick={() => {
                  datatableState.rowsPerPage = opt
                  setPagination(1)
                }}
              >
                {opt}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      Entries
    </div>
    <div class="flex items-center gap-1">
      <div class="join">
        <button
          class="btn join-item"
          disabled={datatableState.currentPage <= 1}
          onclick={() => setPagination(1)}
        >
          {`<<`}
        </button>
        <button
          class="btn join-item"
          disabled={datatableState.currentPage <= 1}
          onclick={() => setPagination(datatableState.currentPage - 1)}
        >
          Previous
        </button>
      </div>

      <span class="">
        Page {datatableState.currentPage} / {maxPages}
      </span>

      <div class="join">
        <button
          class="btn join-item"
          disabled={datatableState.currentPage >= maxPages}
          onclick={() => setPagination(datatableState.currentPage + 1)}
        >
          Next
        </button>
        <button
          class="btn join-item"
          disabled={datatableState.currentPage >= maxPages}
          onclick={() => setPagination(maxPages)}
        >
          {`>>`}
        </button>
      </div>
    </div>
  </footer>
</section>

<style>
  section {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: inherit;
    border-radius: inherit;
  }

  header,
  footer {
    min-height: 4px;
    padding: 0;
  }
  .container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  footer.container {
    border-top: 1px solid var(--grey, #e0e0e0);
  }
  article {
    position: relative;
    height: 100%;
    overflow: auto;
    background: inherit;
    /* scrollbar-width: thin; */
  }
  article::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  article::-webkit-scrollbar-track {
    background: #f5f5f5;
  }
  article::-webkit-scrollbar-thumb {
    background: #c2c2c2;
  }
  article::-webkit-scrollbar-thumb:hover {
    background: #9e9e9e;
  }

  article :global(table) {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    background: inherit;
  }
  article :global(table thead) {
    position: sticky;
    inset-block-start: 0;
    background: inherit;
    z-index: 1;
  }
  article :global(thead tr) {
    background: inherit;
  }
  article :global(thead tr th) {
    background: inherit;
  }
  article :global(thead tr:first-child th) {
    padding: 8px 20px;
    background: inherit;
  }
  article :global(tbody) {
    background: inherit;
  }
  article :global(tbody tr) {
    transition: background, 0.2s;
    background: inherit;
  }
  article :global(tbody tr:hover) {
    background: var(--grey-lighten-3, #fafafa);
  }
  article :global(tbody td) {
    padding: 4px 20px;
    border-right: 1px solid var(--grey-lighten, #eee);
    border-bottom: 1px solid var(--grey-lighten, #eee);
    background: inherit;
  }
  article :global(tbody td:first-child) {
    border-left: 1px solid var(--grey-lighten, #eee);
  }

  article :global(.hidden) {
    display: none;
  }
  article :global(u.highlight) {
    text-decoration: none;
    background: rgba(251, 192, 45, 0.6);
    border-radius: 2px;
  }
</style>
