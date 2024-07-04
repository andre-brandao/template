<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  const { bugs } = data

  import Board from '$lib/components/dnd/DnDBoard.svelte'

  let columnsData = [
    {
      id: 'c1',
      label: 'TODO',
      items: bugs.filter(bug => bug.status === 'TODO'),
    },
    {
      id: 'c2',
      label: 'In Progress',
      items: bugs.filter(bug => bug.status === 'IN_PROGRESS'),
    },
    {
      id: 'c3',
      label: 'DONE',
      items: bugs.filter(bug => bug.status === 'DONE'),
    },
  ]
  function handleBoardUpdated(newColumnsData: typeof columnsData) {
    columnsData = newColumnsData
  }
</script>

<Board columns={columnsData} onFinalUpdate={handleBoardUpdated}>
  {#snippet card(bug)}
    <div
      class=" m-2 w-64 rounded-lg p-3 shadow-md"
      class:todo={bug.status === 'TODO'}
      class:inprogress={bug.status === 'IN_PROGRESS'}
      class:done={bug.status === 'DONE'}
    >
      <h3>{bug.text}</h3>

      <hr />
      <p>Reportado: {bug.created_by_name}</p>

      <div class="">
        {bug.page_data}
      </div>
    </div>
  {/snippet}
</Board>

<style>
  .todo {
    background-color: #f8d7da;
  }

  .inprogress {
    background-color: #fff3cd;
  }

  .done {
    background-color: #d4edda;
  }
</style>
