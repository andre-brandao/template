<script>
  import Board from '$lib/components/dnd/DnDBoard.svelte'

  let columnsData = [
    {
      id: 'c1',
      label: 'TODO',
      items: [
        { id: 1, name: 'item41' },
        { id: 2, name: 'item42' },
        { id: 3, name: 'item43' },
        { id: 4, name: 'item44' },
        { id: 5, name: 'item45' },
        { id: 6, name: 'item46' },
        { id: 7, name: 'item47' },
        { id: 8, name: 'item48' },
        { id: 9, name: 'item49' },
      ],
    },
    {
      id: 'c2',
      label: 'DOING',
      items: [
        { id: 10, name: 'item50' },
        { id: 11, name: 'item51' },
      ],
    },
    {
      id: 'c3',
      label: 'DONE',
      items: [{ id: 13, name: 'item52' }],
    },
    {
      id: 'c4',
      label: 'REVIEW',
      items: [{ id: 14, name: 'item53' }],
    },
    {
      id: 'c5',
      label: 'ARCHIVE',
      items: [{ id: 15, name: 'item54' }],
    }
  ]
  function handleBoardUpdated(newColumnsData) {
    columnsData = newColumnsData
  }
</script>

<Board columns={columnsData} onFinalUpdate={handleBoardUpdated}>
  {#snippet card(c)}
    <div class="card w-96 bg-neutral text-neutral-content glass">
      <div class="card-body items-center text-center">
        <h2 class="card-title">Cookies!</h2>
        <p>We are using cookies for no reason.</p>
        <div class="card-actions justify-end">
          <button class="btn btn-primary">Accept</button>
          <button class="btn btn-ghost">Deny</button>
        </div>
      </div>
    </div>
  {/snippet}
</Board>
