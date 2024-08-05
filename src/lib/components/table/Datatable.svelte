<script lang="ts" generics="T extends {id:any}">
  import { writable } from 'svelte/store'
  import Loading from '../Loading.svelte'
  import {
    createTable,
    FlexRender,
    getCoreRowModel,
  } from '@tanstack/svelte-table'
  import type { ColumnDef, TableOptions } from '@tanstack/svelte-table'
  import { type TableState, createRowChanges } from '.'

  const rowChanges = createRowChanges<T>()
  // import { type TableState } from '.'

  interface DatatableProps {
    data?: T[]
    columns: ColumnDef<T>[]
    add?: (invalidate: Function) => void
    save?: (changes: { [key: string]: T }) => void
    load: (state: TableState) => Promise<
      | {
          data: T[]
          count: number
        }
      | undefined
    >
  }

  let { data, columns, load, save, add }: DatatableProps = $props()

  let datatableState = $state<TableState>({
    page: 1,
    pageSize: 20,
    search: undefined,
  })

  let totalRows = $state(0)
  let isLoading = $state(false)

  let maxPages = $derived(
    Math.ceil(totalRows / (datatableState?.pageSize ?? 10)),
  )

  async function invalidate() {
    isLoading = true
    console.log(true)

    const resp = await load(datatableState)
    console.log(resp)

    if (resp) {
      options.data = resp.data ?? []
      totalRows = resp.count ?? 0
    }
    console.log(false)

    isLoading = false
  }

  let timer: NodeJS.Timeout

  function setSearch(newSearch: string | undefined) {
    // depounce input
    clearTimeout(timer)
    timer = setTimeout(async () => {
      datatableState.page = 1
      datatableState.search = newSearch
      invalidate()
    }, 250)
  }

  // const setFilter = (col: string, newFilter: string) => {
  //   datatableState.page = 1
  //   if (!datatableState.filters) {
  //     datatableState.filters = {}
  //   }
  //   datatableState.filters[col] = newFilter
  //   invalidate()
  // }

  const setPagination = (page: number) => {
    datatableState.page = page
    invalidate()
  }

  const setSort = (field: string, direction: 'asc' | 'desc' | string) => {
    console.log(field, direction)

    datatableState.sort = {
      field,
      direction,
    }
    invalidate()
  }

  function getSortIcon(direction: 'asc' | 'desc' | string) {
    return direction == 'asc'
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-narrow-wide"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h4"/><path d="M11 16h7"/><path d="M11 20h10"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-wide-narrow"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10"/><path d="M11 8h7"/><path d="M11 12h4"/></svg>'
  }

  const options = $state<TableOptions<T>>({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const table = $state(createTable(options))
  invalidate()

  let rowsPerPageOptions = [10, 20, 50, 100]

  async function saveChanges() {
    isLoading = true
    if (save && Object.keys($rowChanges).length > 0) {
      save($rowChanges)
      $rowChanges = {}
    }
    isLoading = false
  }
</script>

<section>
  <header>
    <div
      class="mb-2 flex items-center justify-between rounded-box bg-base-300 p-2"
    >
      <label class="input input-bordered flex items-center gap-2">
        <input
          type="text"
          class="grow"
          placeholder="Search"
          bind:value={datatableState.search}
          oninput={() => setSearch(datatableState.search)}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          class="h-4 w-4 opacity-70"
        >
          <path
            fill-rule="evenodd"
            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
            clip-rule="evenodd"
          />
        </svg>
      </label>

      <div>
        {#if save}
          <button
            class="btn btn-primary"
            disabled={Object.keys($rowChanges).length < 1}
            onclick={saveChanges}
          >
            Save
          </button>
        {/if}
        {#if add}
          <button class="btn btn-primary" onclick={() => add(invalidate)}>
            + Add
          </button>
        {/if}
      </div>
    </div>
  </header>
  <article class="thin-scrollbar">
    {#if isLoading}
      <Loading />
    {:else}
      <table class="table table-zebra ">
        <thead>
          {#each table.getHeaderGroups() as headerGroup}
            <tr>
              {#each headerGroup.headers as header}
                {@const isSortable = header.column.getCanSort()}
                {@const sortDirection =
                  datatableState.sort?.direction == 'asc' &&
                  datatableState.sort?.field == header.column.id
                    ? 'desc'
                    : 'asc'}
                <th colspan={header.colSpan}>
                  {#if !header.isPlaceholder}
                    <button
                      class="flex items-center gap-2"
                      class:btn={isSortable}
                      class:btn-info={isSortable}
                      class:badge={!isSortable}
                      class:badge-info={!isSortable}
                      disabled={!isSortable}
                      onclick={() => setSort(header.column.id, sortDirection)}
                    >
                      <FlexRender
                        content={header.column.columnDef.header}
                        context={header.getContext()}
                      />

                      {#if isSortable}
                        {#if datatableState.sort?.field == header.column.id}
                          <span>
                            {@html getSortIcon(datatableState.sort?.direction)}
                          </span>
                        {:else}
                          <span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              class="lucide lucide-arrow-down-up"
                            >
                              <path d="m3 16 4 4 4-4" />
                              <path d="M7 20V4" />
                              <path d="m21 8-4-4-4 4" />
                              <path d="M17 4v16" />
                            </svg>
                          </span>
                        {/if}
                      {/if}
                    </button>
                  {/if}
                </th>
              {/each}
            </tr>
          {/each}
        </thead>
        <tbody>
          {#each table.getRowModel().rows as row (row.id)}
            <tr class="hover">
              {#each row.getVisibleCells() as cell (cell.id)}
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
      <div class="dropdown dropdown-top dropdown-hover">
        <div tabindex="0" role="button" class="btn m-1">
          {datatableState.pageSize}
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
                  datatableState.pageSize = opt
                  setPagination(1)
                }}
              >
                {opt}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <span>
        Total:
        {totalRows}
      </span>
    </div>
    <div class="flex items-center gap-1">
      <div class="join">
        <button
          class="btn join-item"
          disabled={datatableState.page <= 1}
          onclick={() => setPagination(1)}
        >
          {`<<`}
        </button>
        <button
          class="btn join-item"
          disabled={datatableState.page <= 1}
          onclick={() => setPagination(datatableState.page - 1)}
        >
          Previous
        </button>
      </div>

      <span class="">
        Page {datatableState.page} / {maxPages}
      </span>

      <div class="join">
        <button
          class="btn join-item"
          disabled={datatableState.page >= maxPages}
          onclick={() => setPagination(datatableState.page + 1)}
        >
          Next
        </button>
        <button
          class="btn join-item"
          disabled={datatableState.page >= maxPages}
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

  article :global(tbody td) {
    padding: 4px 20px;
    /* border-right: 1px solid var(--grey-lighten, #eee); */
    /* border-bottom: 1px solid var(--grey-lighten, #eee); */
    background: inherit;
  }

  article :global(.hidden) {
    display: none;
  }
</style>
