<script lang="ts" generics="T extends {id:any}, K extends{id:any} ">
  import {
    dndzone,
    type DndEvent,
    SHADOW_ITEM_MARKER_PROPERTY_NAME,
  } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import type { Snippet } from 'svelte'
  import { fade } from 'svelte/transition'
  import { cubicIn } from 'svelte/easing'

  const FILP_DURATION = 150

  interface DnDColumnProps {
    category: K
    items: T[]
    card: Snippet<[T]>
    collum: Snippet<[K]>
    onDrop: (items: T[]) => void
    disabled?: boolean
  }

  let { category, items, card, collum, onDrop, disabled }: DnDColumnProps =
    $props()

  function handleDndConsiderCards(e: CustomEvent<DndEvent<T>>) {
    console.warn('got consider', category)
    items = e.detail.items
  }
  function handleDndFinalizeCards(e: CustomEvent<DndEvent<T>>) {
    onDrop(e.detail.items)
  }
</script>

<div class="wrapper">
  <div class="column-title divider text-2xl">
    {#if collum}
      {@render collum(category)}
    {:else}
      <h1>{JSON.stringify(category)}</h1>
    {/if}
  </div>
  <div
    class="column-content"
    use:dndzone={{
      items,
      flipDurationMs: FILP_DURATION,
      zoneTabIndex: -1,
      dragDisabled: disabled,
    }}
    onconsider={handleDndConsiderCards}
    onfinalize={handleDndFinalizeCards}
  >
    {#each items as item (item.id)}
      <div class="card" animate:flip={{ duration: FILP_DURATION }}>
        {@render card(item)}

        {#if item[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
          <div
            in:fade={{ duration: 300, easing: cubicIn }}
            class="custom-shadow-item"
          >
            {@render card(item)}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .wrapper {
    height: 100%;
    width: 100%;
    /*Notice we make sure this container doesn't scroll so that the title stays on top and the dndzone inside is scrollable*/
    overflow-y: hidden;
  }
  .column-content {
    height: calc(100% - 2.5em);
    /* Notice that the scroll container needs to be the dndzone if you want dragging near the edge to trigger scrolling */
    overflow-y: scroll;
  }
  .column-title {
    height: 2.5em;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .card {
    /* height: 4em; */
    width: 100%;
    margin: 0.4em 0;
    display: flex;
    justify-content: center;
    align-items: center;
    /* background-color: #dddddd; */
    /* border: 1px solid #333333; */
  }

  .custom-shadow-item {
    position: absolute;
    visibility: visible;
    border: 1px dashed grey;
    background: lightblue;
    opacity: 0.35;
    margin: 0;
  }
</style>
