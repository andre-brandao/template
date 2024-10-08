<script lang="ts" generics="T extends {id: any}">
  import { flip } from 'svelte/animate'
  import type { Snippet } from 'svelte'

  const FLIP_DURATION = 300
  interface DnDContainerProps {
    containers: {
      id: string
      label: string
      isDraggingOver: boolean
      row: (T & { isDragging?: boolean; isOver?: boolean })[]
    }[]

    card: Snippet<[T]>
  }

  let { containers, card }: DnDContainerProps = $props()

  let currentDraggedItem = $state<T>()

  function removeItemFromAllContainers(id: number) {
    containers = containers.map(c => {
      c.row = c.row.filter(t => t.id !== id)
      return c
    })
  }

  function drop(e: DragEvent, tasks: T[]) {
    if (!currentDraggedItem) return

    let dropTarget = e.target as HTMLElement

    while (dropTarget && dropTarget.nodeName !== 'LI') {
      dropTarget = dropTarget.parentElement as HTMLElement
    }

    if (!dropTarget) {
      removeItemFromAllContainers(currentDraggedItem.id)
      tasks.push(currentDraggedItem)
      return tasks
    }

    const id = dropTarget.getAttribute('id')
    if (!id) return
    const dropTargetIndex = tasks.findIndex(t => t.id == id)
    if (dropTargetIndex === -1) return
    removeItemFromAllContainers(currentDraggedItem.id)
    tasks.splice(dropTargetIndex, 0, currentDraggedItem)
    return tasks
  }

  function dragging(e: DragEvent, arr: T[]) {
    const id = (e.target as HTMLElement).getAttribute('id')
    if (!id) return
    const grabed = arr.find(t => t.id == id)
    if (grabed) currentDraggedItem = grabed
  }

  // $inspect(containers)
</script>

<main class="container mx-auto mt-4 grid grid-cols-3 justify-center gap-3">
  {#each containers as container, i (container.id)}
    <div
      class="drop-zone flex h-[70vh] flex-col gap-3 overflow-scroll rounded-lg bg-slate-200 p-1"
      role="listitem"
      ondrop={e => {
        const dropRes = drop(e, container.row)
        if (dropRes) {
          containers[i].row = dropRes
        }
      }}
      ondragenter={() => (container.isDraggingOver = true)}
      ondragleave={() => (container.isDraggingOver = false)}
      ondragover={e => e.preventDefault()}
      class:ring={container.isDraggingOver}
      class:ring-primary={container.isDraggingOver}
    >
      <div class="pt-2 text-center text-2xl">
        {container.label}
      </div>
      <ul class="flex w-full list-none flex-col gap-2">
        {#each container.row as t (t.id)}
          <li
            id={t.id}
            ondrag={e => dragging(e, container.row)}
            draggable="true"
            ondragenter={() => (t.isOver = true)}
            ondragleave={() => (t.isOver = false)}
            ondrop={() => (t.isOver = false)}
            class:after:top-[-13px]={t.isOver}
            class:after:absolute={t.isOver}
            class:after:left-0={t.isOver}
            class:after:w-full={t.isOver}
            class:after:border-t-4={t.isOver}
            class:after:border-dotted={t.isOver}
            class:after:border-red-500={t.isOver}
            ondragstart={() => (t.isDragging = true)}
            ondragend={() => (t.isDragging = false)}
            class:opacity-50={t.isDragging}
            class="glass relative flex w-full cursor-grab"
            animate:flip={{
              duration: FLIP_DURATION,
            }}
          >
            {#if card}
              {@render card(t)}
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</main>
