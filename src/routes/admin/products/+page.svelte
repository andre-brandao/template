<script lang="ts">
  import type { PageData } from './$types'
  import DnDBoard from '$components/dnd/DnDBoard.svelte'

  export let data: PageData

  const columnsData = Object.entries(data.products).map(([key, value]) => ({
    id: value.category.id,
    label: value.category.name,
    items: value.products,
  }))

  async function handleBoardUpdated(newColumnsData: typeof columnsData) {
    console.log(newColumnsData)
  }
</script>

<DnDBoard columns={columnsData} onFinalUpdate={handleBoardUpdated} disabled={
  {
    card: false,
    column: false,
  }
}>
  {#snippet card(p)}
    <p>
      {JSON.stringify(p)}
    </p>
  {/snippet}
</DnDBoard>
