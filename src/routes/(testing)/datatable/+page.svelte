<script lang="ts">
  import type { SelectProduct } from '$lib/server/db/schema'
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

  import { getParams } from '$utils/datatable'

  let isLoading = false

  async function myLoadFunction(state: State) {
    isLoading = true

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await fetch(`/datatable?${getParams(state)}`, {
        method: 'POST',
      }).then(res => res.json())
      const { total, rows } = response

      state.setTotalRows(total)
      isLoading = false
      return rows
    } catch (error) {
      isLoading = false
    }
  }

  const table = new TableHandler<SelectProduct>([], {
    rowsPerPage: 10,
    totalRows: 0,
  })

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
      {#if isLoading}
        <div class="spinner" class:active={isLoading}>
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
            
          </div>
        </div>
      {:else}
        <table class="table table-xs h-[50vh] table-auto">
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
              <tr
                class:selected={table.selected.includes(row.id)}
                class="table-row"
              >
                <td>
                  <input
                    type="checkbox"
                    checked={table.selected.includes(row.id)}
                    onclick={() => table.select(row.id)}
                  />
                </td>
                <td>{row.created_at}</td>
                <td>{row.name}</td>
                <td class="table-cell">{row.description}</td>
                <td>{row.price}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
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
  .selected:hover {
    @apply bg-primary;
  }
</style>
