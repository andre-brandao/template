<script lang="ts">
  import { myLoadFunction } from '$lib/datatables/load-funcions'
  import type { PageData } from './$types'

  export let data: PageData

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

  const table = new TableHandler([], { rowsPerPage: 10 })

  table.load((state: State) => myLoadFunction(state))

  let search = table.createSearch()

  table.invalidate()
</script>

<div class="container mx-auto p-2">
  <Datatable {table}>
    {#snippet header()}
      <Search {table} />
      <RowsPerPage {table} />
    {/snippet}

    <table class="table table-zebra">
      <thead>
        <tr>
          <ThSort {table} field="username">Name</ThSort>
          <!-- <ThSort {table} field="company_name">Company Name</ThSort> -->
          <!-- <ThSort {table} field="email">Email</ThSort> -->
        </tr>
      </thead>
      <tbody>
        {#each table.rows as row}
          <tr>
            <td>{row.username}</td>
            <!-- <td>{row.company.name}</td> -->
            <!-- <td>{row.email}</td> -->
          </tr>
        {/each}
      </tbody>
    </table>

    {#snippet footer()}
      <RowCount {table} />
      <Pagination {table} />
    {/snippet}
  </Datatable>
</div>
