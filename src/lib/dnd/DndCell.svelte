<script lang="ts" generics="T extends {id:any}">
  import type { Snippet } from 'svelte'

  interface DnDCellProps {
    card: Snippet<[T]>
    data: T
    ondrag: (e: DragEvent) => void
  }
  let { card, data, ondrag }: DnDCellProps = $props()

  let isOver = $state(false)
  let isDragging = $state(false)
</script>

<li
  {ondrag}
  id={data.id}
  draggable="true"
  ondragstart={() => (isDragging = true)}
  ondragend={() => (isDragging = false)}
  ondragenter={() => (isOver = true)}
  ondragleave={() => (isOver = false)}
  ondrop={() => (isOver = false)}
  class:after:top-[-13px]={isOver}
  class:after:absolute={isOver}
  class:after:left-0={isOver}
  class:after:w-full={isOver}
  class:after:border-t-4={isOver}
  class:after:border-dotted={isOver}
  class:after:border-red-500={isOver}
  class:opacity-50={isDragging}
  class="relative flex w-full cursor-grab"
>
  {#if card}
    {@render card(data)}
  {:else}
    <p>ERROR: create a snippet for the card</p>
  {/if}
</li>
