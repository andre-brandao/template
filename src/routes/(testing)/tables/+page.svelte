<script lang="ts">
  import { navigating } from '$app/stores'
  import { SSRFilters } from '$lib/client/components/table/filter.svelte'
  import {
    TableHandler,
    Datatable,
    ThSort,
    ThFilter,
    Pagination,
    RowsPerPage,
    Search,
    type State,
  } from '@vincjo/datatables/server'

  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const filters = new SSRFilters()

  const table = new TableHandler(data.rows, {
    rowsPerPage: 10,
    totalRows: data.count,
  })

  table.setPage(Number(filters.get('page')) || 1)
  table.load(async s => {
    console.log(s)
    filters.fromState(s)
    await $navigating?.complete
    return data.rows
  })
</script>

<main class="container mx-auto h-full">
  <Datatable {table}>
    <!-- {#snippet header()}
      <Search {table} />
     
    {/snippet} -->
    <table class="table table-zebra">
      <thead>
        <tr>
          <ThSort {table} field="id">ID</ThSort>
          <ThSort {table} field="email">Email</ThSort>
          <ThSort {table} field="name">Name</ThSort>
          <ThSort {table} field="emailVerified">Verified</ThSort>
        </tr>
        <tr>
          <ThFilter {table} field="id" />
          <ThFilter {table} field="email" />
          <ThFilter {table} field="name" />
        </tr>
      </thead>
      <tbody>
        {#each table.rows as row}
          <tr>
            <td>{row.id}</td>
            <td><b>{row.email}</b></td>
            <td><b>{row.name}</b></td>

            <td><span>{row.emailVerified ? '✅' : '❌'}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#snippet footer()}
      <RowsPerPage {table} />
      <div></div>
      <Pagination {table} />
    {/snippet}
  </Datatable>
</main>
