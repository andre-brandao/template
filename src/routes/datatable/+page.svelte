<script lang="ts">
  import { myLoadFunction } from '$lib/datatables/load-funcions'
  import type { PageData } from './$types'

  export let data: PageData

  import {
    type State,
    TableHandler,
    Datatable,
    ThSort,
  } from '@vincjo/datatables/server'

  const table = new TableHandler([], { rowsPerPage: 10 })

  table.load((state: State) => myLoadFunction(state))

  let search = table.createSearch()

  table.invalidate()
</script>

<div class="container card mx-auto bg-base-200 p-2">
  <Datatable {table}>
    <input
      type="search"
      class="input"
      bind:value={search.value}
      placeholder="Search..."
      oninput={() => {
        search.set()
      }}
    />
    <table class="table">
      <thead>
        <tr>
          <ThSort {table} field="name">Name</ThSort>
          <ThSort {table} field="company_name">Company Name</ThSort>
          <ThSort {table} field="email">Email</ThSort>
        </tr>
      </thead>
      <tbody>
        {#each table.rows as row}
          <tr>
            <td>{row.name}</td>
            <td>{row.company.name}</td>
            <td>{row.email}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <aside class="flex justify-center gap-3">
      <button onclick={() => table.setPage(1)}>First page</button>
      <button onclick={() => table.setPage('previous')}>Previous</button>

      {#each table.pagesWithEllipsis as page}
        <button
          class:active={page === table.currentPage}
          onclick={() => table.setPage(page)}
        >
          {page ?? '...'}
        </button>
      {/each}

      <button onclick={() => table.setPage('next')}>Next</button>
      <button onclick={() => table.setPage('last')}>Last page</button>
    </aside>
  </Datatable>
</div>
