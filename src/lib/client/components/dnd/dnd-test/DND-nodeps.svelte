<script lang="ts">
  import { toast } from 'svelte-sonner'
  import Task from './Task.svelte'

  import { flip } from 'svelte/animate'

  const FLIP_DURATION = 300

  interface Task {
    id: number
    text: string
  }

  let tasksTodo = [
    { id: 1, text: 'Learn Svelte' },
    { id: 2, text: 'Learn TypeScript' },
    { id: 3, text: 'Build something awesome' },
  ]

  let tasksCompleted: Task[] = []

  let isDragingOverComplete = false
  let isDragingOverTodo = false
  let currentDraggedItem: Task

  function drop(e: DragEvent, tasks: Task[]) {
    toast('Todo droped: ' + currentDraggedItem.text)
    tasksTodo = tasksTodo.filter(t => t.id !== currentDraggedItem.id)
    tasksCompleted = tasksCompleted.filter(t => t.id !== currentDraggedItem.id)

    if (currentDraggedItem) {
      console.log('currentDraggedItem', currentDraggedItem)

      const dropTarget = e.target as HTMLElement
      if (dropTarget.nodeName === 'LI') {
        const id = dropTarget.getAttribute('id')
        if (!id) {
          return
        }
        const dropTargetIndex = tasks.findIndex(t => t.id === +id)
        tasks.splice(dropTargetIndex, 0, currentDraggedItem)
      } else {
        tasks.push(currentDraggedItem)
      }
      console.log(tasks)
      return tasks
    }
  }

  function dragging(e: DragEvent, arr: any[]) {
    const id = (e.target as HTMLElement).getAttribute('id')
    if (!id) {
      return
    }
    const todo = arr.find(t => t.id === +id)

    if (todo) {
      currentDraggedItem = todo
      // toast('Todo draging: ' + todo.text)
    }
  }
</script>

<main class="container mx-auto mt-4 flex justify-between">
  <div
    class="drop-zone flex h-[400px] w-1/3 flex-col gap-3 bg-slate-200 p-1"
    role="listitem"
    ondrop={e => {
      const dropRes = drop(e, tasksTodo)
      if (dropRes) {
        tasksTodo = dropRes
      }
    }}
    ondragenter={() => (isDragingOverTodo = true)}
    ondragleave={() => (isDragingOverTodo = false)}
    ondragover={e => e.preventDefault()}
    class:ring={isDragingOverTodo}
    class:ring-green-500={isDragingOverTodo}
  >
    <h1>Todo</h1>
    <li>
      {#each tasksTodo as t (t.id)}
        <div
          animate:flip={{
            duration: FLIP_DURATION,
          }}
        >
          <Task todo={t} on:drag={e => dragging(e, tasksTodo)} />
        </div>
      {/each}
    </li>
  </div>

  <div
    ondrop={e => {
      const dropRes = drop(e, tasksCompleted)
      if (dropRes) {
        tasksCompleted = dropRes
      }
    }}
    ondragenter={() => (isDragingOverComplete = true)}
    ondragleave={() => (isDragingOverComplete = false)}
    ondragover={e => e.preventDefault()}
    class="drop-zone flex h-[400px] w-1/3 flex-col gap-3 bg-slate-200 p-1"
    class:ring={isDragingOverComplete}
    class:ring-green-500={isDragingOverComplete}
    role="listitem"
    id="drop_zone"
  >
    <h1>Completed</h1>
    <li>
      {#each tasksCompleted as t (t.id)}
        <div
          animate:flip={{
            duration: FLIP_DURATION,
          }}
        >
          <Task todo={t} on:drag={e => dragging(e, tasksCompleted)} />
        </div>
      {/each}
    </li>
  </div>
</main>
