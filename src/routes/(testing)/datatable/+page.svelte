<script lang="ts">
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import type { SelectProduct } from '$lib/server/db/schema'

  // export let data: PageData

  interface PageProps {
    data: PageData
  }
  let { data }: PageProps = $props()

  import {
    type State,
    TableHandler,
    Datatable,
    ThSort,
    Search,
    Pagination,
    RowCount,
    RowsPerPage,
  } from '@vincjo/datatables/server'

  async function myLoadFunction(state: State) {
    console.log(state.sort)

    const response = await fetch(`/datatable?${getParams(state)}`, {
      method: 'POST',
    }).then(res => res.json())
    const { total, rows } = response

    state.setTotalRows(total)
    return rows
  }

  const getParams = ({
    offset,
    rowsPerPage,
    search,
    sort,
    filters,
    currentPage,
  }: State) => {
    let params = `offset=${offset}&limit=${rowsPerPage}`
    if (search) params += `&q=${search}`
    if (sort) params += `&sort=${sort.field}&order=${sort.direction}`
    if (currentPage) params += `&page=${currentPage}`
    if (filters) {
      params += filters.map(({ field, value }) => `&${field}=${value}`).join()
    }
    return params
  }

  const table = new TableHandler<SelectProduct>([], { rowsPerPage: 10 })

  table.load((state: State) => myLoadFunction(state))

  let search = table.createSearch()

  table.invalidate()
</script>

<div class="container mx-auto border p-2">
  <Datatable basic {table}>
    {#snippet header()}
      <Search {table}></Search>
      <RowsPerPage {table}></RowsPerPage>
    {/snippet}

    {#snippet children()}
      <!-- <div class="spinner" class:active={table.isLoading}></div> -->
      <table class="table table-xs table-auto">
        <thead class="">
          <tr>
            <td class=""> </td>
            <ThSort {table} field="created_at">Created At</ThSort>
            <ThSort {table} field="name">Name</ThSort>
            <ThSort {table} field="description">description</ThSort>
            <ThSort {table} field="price">Price</ThSort>
          </tr>
        </thead>
        <tbody>
          {#each table.rows as row}
            <tr class:selected={table.selected.includes(row.id)}>
              <td>
                <input
                  type="checkbox"
                  checked={table.selected.includes(row.id)}
                  onclick={() => table.select(row.id)}
                />
              </td>
              <td>{row.created_at}</td>
              <td>{row.name}</td>
              <td>{row.description}</td>
              <td>{row.price}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/snippet}

    {#snippet footer()}
      <RowCount {table}></RowCount>
      <Pagination {table}></Pagination>
    {/snippet}
  </Datatable>
</div>

<style>
  div.spinner {
    display: none;
  }
  div.spinner.active {
    display: block;
  }

  .selected {
    @apply bg-primary;
  }
</style>
