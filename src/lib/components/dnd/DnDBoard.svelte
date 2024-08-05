<script lang="ts" generics="T extends {id:any},K extends {id:any}">
  import { flip } from 'svelte/animate'
  import {
    dndzone,
    type DndEvent,
    dragHandle,
    dragHandleZone,
    SHADOW_ITEM_MARKER_PROPERTY_NAME,
  } from 'svelte-dnd-action'
  import Column from './DnDColum.svelte'
  import type { Snippet } from 'svelte'
  import { fade } from 'svelte/transition'
  import { cubicIn } from 'svelte/easing'
  const FLIP_DURATION = 300

  interface DnDColum {
    id: any,
    category: K
    items: T[]
  }

  interface DnDContainerProps {
    columns: DnDColum[]
    onFinalUpdate: (columns: DnDColum[]) => void
    onItemFinalUpdate?: (columnIdx: number, newItems: T[]) => void
    card: Snippet<[T]>
    collum: Snippet<[K]>
    disabled?: {
      column?: boolean
      card?: boolean
    }
  }

  let {
    columns,
    onFinalUpdate,
    onItemFinalUpdate = (c, i) => {},
    card,
    collum,
    disabled,
  }: DnDContainerProps = $props()
  // will be called any time a card or a column gets dropped to update the parent data
  function handleDndConsiderColumns(e: CustomEvent<DndEvent<DnDColum>>) {
    columns = e.detail.items
  }
  function handleDndFinalizeColumns(e: CustomEvent<DndEvent<DnDColum>>) {
    onFinalUpdate(e.detail.items)
  }
  function handleItemFinalize(columnIdx: number, newItems: T[]) {
    columns[columnIdx].items = newItems
    onItemFinalUpdate(columnIdx, newItems)
    onFinalUpdate([...columns])
  }
</script>

<section
  class="board"
  use:dndzone={{
    items: columns,
    flipDurationMs: FLIP_DURATION,
    type: 'column',
    dragDisabled: disabled?.column,
  }}
  onconsider={handleDndConsiderColumns}
  onfinalize={handleDndFinalizeColumns}
>
  {#each columns as col, idx (col.id)}
    <div
      class="column rounded-lg bg-base-300 bg-opacity-40"
      animate:flip={{ duration: FLIP_DURATION }}
    >
      <Column
        disabled={disabled?.card}
        category={col.category}
        {collum}
        items={col.items}
        {card}
        onDrop={newItems => handleItemFinalize(idx, newItems)}
      />
    </div>
  {/each}
</section>

<style>
  .board {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    height: 80vh;
    width: 100%;
    padding: 0.5em;
  }
  .column {
    height: 100%;
    width: 25%;
    padding: 0.5em;
    margin: 0.5em;
    float: left;
    border: 1px solid #333333;
  }
  .custom-shadow-item {
    position: absolute;
    visibility: visible;
    border: 1px dashed grey;
    background: lightblue;
    opacity: 0.30;
    margin: 0;
  }
</style>
